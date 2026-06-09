SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA public;

COMMENT ON SCHEMA public IS 'standard public schema';


CREATE TYPE public.capsule_status AS ENUM (
    'collecting',
    'sealed',
    'ready',
    'opened'
);



CREATE TYPE public.member_role AS ENUM (
    'viewer',
    'editor'
);



CREATE TYPE public.member_status AS ENUM (
    'pending',
    'accepted',
    'declined'
);



CREATE TYPE public.notification_type AS ENUM (
    'upcoming',
    'condition_met',
    'public',
    'invitation',
    'activity'
);



CREATE TYPE public.user_role AS ENUM (
    'user',
    'admin'
);



CREATE FUNCTION public.admin_audit_actions() RETURNS TABLE(action text)
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  select distinct action from audit_log order by action;
$$;


CREATE FUNCTION public.admin_audit_log(p_action text DEFAULT NULL::text, p_actor text DEFAULT NULL::text, p_date_from timestamp with time zone DEFAULT NULL::timestamp with time zone, p_date_to timestamp with time zone DEFAULT NULL::timestamp with time zone) RETURNS TABLE(id uuid, action text, entity_type text, entity_id uuid, actor_email text, created_at timestamp with time zone)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
begin
  if not public.is_admin() then return; end if;
  return query
    select a.id, a.action, a.entity_type, a.entity_id, p.email, a.created_at
    from audit_log a
    left join profiles p on p.id = a.user_id
    where (p_action    is null or a.action = p_action)
      and (p_actor     is null or p.email ilike '%' || p_actor || '%')
      and (p_date_from is null or a.created_at >= p_date_from)
      and (p_date_to   is null or a.created_at <  p_date_to + interval '1 day')
    order by a.created_at desc
    limit 200;
end;
$$;


CREATE FUNCTION public.admin_list_users() RETURNS TABLE(id uuid, email text, first_name text, last_name text, role public.user_role, is_active boolean)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
begin
  if not public.is_admin() then return; end if;
  return query
    select p.id, p.email, p.first_name, p.last_name, p.role, p.is_active
    from profiles p
    order by p.email;
end;
$$;


CREATE FUNCTION public.admin_set_active(target_id uuid, active boolean) RETURNS text
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
begin
  if not public.is_admin() then return 'forbidden'; end if;
  if target_id = auth.uid() then return 'self'; end if;  -- admin nie blokuje sam siebie
  update profiles set is_active = active where id = target_id;
  return 'ok';
end;
$$;


CREATE FUNCTION public.can_access_capsule(cap_id uuid) RETURNS boolean
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  select public.is_capsule_owner(cap_id) or public.is_capsule_member(cap_id);
$$;



CREATE FUNCTION public.delete_my_account() RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
begin
  delete from public.capsules where owner_id = auth.uid();
  delete from public.profiles where id = auth.uid();
  delete from auth.users where id = auth.uid();
end;
$$;


CREATE FUNCTION public.get_capsule_contents_with_authors(cap_id uuid) RETURNS TABLE(content_id uuid, encrypted_message text, author_id uuid, author_name text, created_at timestamp with time zone)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
begin
  if not (public.is_capsule_owner(cap_id) or public.is_accepted_member(cap_id)) then
    return;
  end if;

  return query
    select
      cc.id,
      cc.encrypted_message,
      cc.author_id,
      coalesce(nullif(trim(concat(p.first_name, ' ', p.last_name)), ''), p.email),
      cc.created_at
    from capsule_contents cc
    left join profiles p on p.id = cc.author_id
    where cc.capsule_id = cap_id
    order by cc.created_at;
end;
$$;


CREATE FUNCTION public.get_capsule_members(cap_id uuid) RETURNS TABLE(member_id uuid, user_id uuid, email text, member_role public.member_role, invited_at timestamp with time zone)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
begin
  if not public.is_capsule_owner(cap_id) then
    return;
  end if;

  return query
    select m.id, m.user_id, p.email, m.member_role, m.invited_at
    from capsule_members m
    join profiles p on p.id = m.user_id
    where m.capsule_id = cap_id
    order by m.invited_at;
end;
$$;


CREATE FUNCTION public.get_my_invitations() RETURNS TABLE(member_id uuid, capsule_id uuid, capsule_title text, owner_name text, owner_email text, open_date timestamp with time zone, status public.member_status)
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  select
    m.id,
    c.id,
    c.title,
    coalesce(nullif(trim(concat(p.first_name, ' ', p.last_name)), ''), p.email),
    p.email,
    oc.open_date,
    m.status
  from capsule_members m
  join capsules c on c.id = m.capsule_id
  join profiles p on p.id = c.owner_id
  left join open_conditions oc on oc.capsule_id = c.id
  where m.user_id = auth.uid()
    and m.status = 'pending';
$$;

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
begin
  insert into public.profiles (id, email, first_name, last_name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name'
  );
  return new;
end;
$$;


CREATE FUNCTION public.invite_member(cap_id uuid, invitee_email text, invitee_role public.member_role) RETURNS text
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
  target_id uuid;
begin
  if not public.is_capsule_owner(cap_id) then
    return 'forbidden';
  end if;

  select id into target_id from profiles
  where lower(email) = lower(trim(invitee_email)) limit 1;

  if target_id is null then return 'notfound'; end if;
  if target_id = auth.uid() then return 'self'; end if;

  if exists (select 1 from capsule_members where capsule_id = cap_id and user_id = target_id) then
    return 'exists';
  end if;

  insert into capsule_members (capsule_id, user_id, member_role)
  values (cap_id, target_id, invitee_role);

  insert into notifications (user_id, capsule_id, type, is_sent, is_read, scheduled_at)
  select target_id, cap_id, 'invitation', true, false, now()
  from profiles where id = target_id and notify_invitations;

  return 'ok';
end;
$$;


CREATE FUNCTION public.is_accepted_member(cap_id uuid) RETURNS boolean
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  select exists (
    select 1 from capsule_members
    where capsule_id = cap_id and user_id = auth.uid() and status = 'accepted'
  );
$$;


CREATE FUNCTION public.is_admin() RETURNS boolean
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;


CREATE FUNCTION public.is_capsule_editor(cap_id uuid) RETURNS boolean
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  select exists (
    select 1 from capsule_members
    where capsule_id = cap_id
      and user_id = auth.uid()
      and member_role = 'editor'
  );
$$;


CREATE FUNCTION public.is_capsule_member(cap_id uuid) RETURNS boolean
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  select exists (
    select 1 from capsule_members where capsule_id = cap_id and user_id = auth.uid()
  );
$$;


CREATE FUNCTION public.is_capsule_owner(cap_id uuid) RETURNS boolean
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  select exists (
    select 1 from capsules where id = cap_id and owner_id = auth.uid()
  );
$$;



CREATE FUNCTION public.is_collecting(cap_id uuid) RETURNS boolean
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  select exists (
    select 1 from capsules
    where id = cap_id
      and status = 'collecting'
      and (seal_deadline is null or seal_deadline > now())
  );
$$;



CREATE FUNCTION public.log_audit(p_action text, p_entity_type text, p_entity_id uuid) RETURNS void
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  insert into audit_log (user_id, action, entity_type, entity_id)
  values (auth.uid(), p_action, p_entity_type, p_entity_id);
$$;



CREATE FUNCTION public.mark_notifications_read() RETURNS void
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  update notifications set is_read = true
  where user_id = auth.uid() and is_read = false;
$$;




CREATE FUNCTION public.mark_one_notification_read(notif_id uuid) RETURNS void
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  update notifications set is_read = true
  where id = notif_id and user_id = auth.uid();
$$;

CREATE FUNCTION public.notify_capsule_members(cap_id uuid, p_type public.notification_type, p_exclude uuid DEFAULT NULL::uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
begin
  insert into notifications (user_id, capsule_id, type, is_sent, is_read, scheduled_at)
  select r.uid, cap_id, p_type, true, false, now()
  from (
    select owner_id as uid from capsules where id = cap_id
    union
    select user_id from capsule_members where capsule_id = cap_id and status = 'accepted'
  ) r
  join profiles p on p.id = r.uid
  where (p_exclude is null or r.uid <> p_exclude)
    and (
      (p_type = 'condition_met' and p.notify_opening)
      or (p_type = 'upcoming'    and p.notify_reminder)
      or (p_type = 'activity'    and p.notify_group_activity)
      or (p_type = 'public')
    );
end;
$$;


CREATE FUNCTION public.process_capsule_lifecycle() RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
begin

  update capsules
  set status = 'sealed', sealed_at = now()
  where status = 'collecting'
    and seal_deadline is not null
    and seal_deadline <= now();

  insert into notifications (user_id, capsule_id, type, is_sent, is_read, scheduled_at)
  select r.uid, c.id, 'upcoming', true, false, now()
  from capsules c
  join open_conditions oc on oc.capsule_id = c.id
  cross join lateral (
    select owner_id as uid from capsules where id = c.id
    union
    select user_id from capsule_members where capsule_id = c.id and status = 'accepted'
  ) r
  join profiles p on p.id = r.uid
  where c.status = 'sealed'
    and oc.open_date is not null
    and oc.open_date <= now() + interval '7 days'
    and oc.open_date > now()
    and p.notify_reminder
    and not exists (
      select 1 from notifications n
      where n.capsule_id = c.id and n.user_id = r.uid and n.type = 'upcoming'
    );
end;
$$;


CREATE FUNCTION public.respond_to_invitation(member_row_id uuid, accept boolean) RETURNS text
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
  target_user uuid;
begin
  select user_id into target_user
  from capsule_members
  where id = member_row_id;

  if target_user is null or target_user <> auth.uid() then
    return 'forbidden';
  end if;

  update capsule_members
  set status = case when accept then 'accepted'::member_status else 'declined'::member_status end
  where id = member_row_id;

  return case when accept then 'accepted' else 'declined' end;
end;
$$;


CREATE FUNCTION public.rls_auto_enable() RETURNS event_trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'pg_catalog'
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;

CREATE FUNCTION public.user_exists_by_email(check_email text) RETURNS boolean
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  select exists (
    select 1 from profiles where lower(email) = lower(trim(check_email))
  );
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;


CREATE TABLE public.audit_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    action text NOT NULL,
    entity_type text,
    entity_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.capsule_contents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    capsule_id uuid NOT NULL,
    encrypted_message text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    author_id uuid
);

CREATE TABLE public.capsule_files (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    capsule_id uuid NOT NULL,
    file_name text NOT NULL,
    mime_type text,
    size_bytes bigint,
    storage_path text NOT NULL,
    author_id uuid
);


CREATE TABLE public.capsule_members (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    capsule_id uuid NOT NULL,
    user_id uuid NOT NULL,
    member_role public.member_role DEFAULT 'viewer'::public.member_role NOT NULL,
    invited_at timestamp with time zone DEFAULT now() NOT NULL,
    status public.member_status DEFAULT 'pending'::public.member_status NOT NULL,
    contribution_done boolean DEFAULT false NOT NULL
);


CREATE TABLE public.capsules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    owner_id uuid NOT NULL,
    title text NOT NULL,
    status public.capsule_status DEFAULT 'sealed'::public.capsule_status NOT NULL,
    is_public boolean DEFAULT false NOT NULL,
    capsule_password_hash text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    sealed_at timestamp with time zone,
    description text,
    seal_deadline timestamp with time zone
);


CREATE TABLE public.notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    capsule_id uuid,
    type public.notification_type NOT NULL,
    is_sent boolean DEFAULT false NOT NULL,
    scheduled_at timestamp with time zone,
    is_read boolean DEFAULT false NOT NULL
);



CREATE TABLE public.open_conditions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    capsule_id uuid NOT NULL,
    open_date timestamp with time zone
);

CREATE TABLE public.open_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    capsule_id uuid NOT NULL,
    opened_by uuid NOT NULL,
    opened_at timestamp with time zone DEFAULT now() NOT NULL,
    conditions_met text
);



CREATE TABLE public.profiles (
    id uuid NOT NULL,
    email text NOT NULL,
    first_name text,
    last_name text,
    avatar_url text,
    role public.user_role DEFAULT 'user'::public.user_role NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    notify_opening boolean DEFAULT true NOT NULL,
    notify_reminder boolean DEFAULT true NOT NULL,
    notify_invitations boolean DEFAULT true NOT NULL,
    notify_group_activity boolean DEFAULT true NOT NULL,
    username text
);


CREATE TABLE public.public_memories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    capsule_id uuid NOT NULL,
    memory_date date NOT NULL,
    owner_id uuid,
    title text,
    note text,
    lat double precision,
    lng double precision,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    cover_url text
);

ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT audit_log_pkey PRIMARY KEY (id);


ALTER TABLE ONLY public.capsule_contents
    ADD CONSTRAINT capsule_contents_pkey PRIMARY KEY (id);


ALTER TABLE ONLY public.capsule_files
    ADD CONSTRAINT capsule_files_pkey PRIMARY KEY (id);


ALTER TABLE ONLY public.capsule_members
    ADD CONSTRAINT capsule_members_capsule_id_user_id_key UNIQUE (capsule_id, user_id);


ALTER TABLE ONLY public.capsule_members
    ADD CONSTRAINT capsule_members_pkey PRIMARY KEY (id);


ALTER TABLE ONLY public.capsules
    ADD CONSTRAINT capsules_pkey PRIMARY KEY (id);


ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.open_conditions
    ADD CONSTRAINT open_conditions_capsule_id_key UNIQUE (capsule_id);


ALTER TABLE ONLY public.open_conditions
    ADD CONSTRAINT open_conditions_pkey PRIMARY KEY (id);


ALTER TABLE ONLY public.open_history
    ADD CONSTRAINT open_history_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_username_key UNIQUE (username);

ALTER TABLE ONLY public.public_memories
    ADD CONSTRAINT public_memories_capsule_unique UNIQUE (capsule_id);

ALTER TABLE ONLY public.public_memories
    ADD CONSTRAINT public_memories_pkey PRIMARY KEY (id);

CREATE INDEX idx_capsules_owner ON public.capsules USING btree (owner_id);

CREATE INDEX idx_contents_capsule ON public.capsule_contents USING btree (capsule_id);

CREATE INDEX idx_files_capsule ON public.capsule_files USING btree (capsule_id);

CREATE INDEX idx_history_capsule ON public.open_history USING btree (capsule_id);

CREATE INDEX idx_members_capsule ON public.capsule_members USING btree (capsule_id);

CREATE INDEX idx_members_user ON public.capsule_members USING btree (user_id);

CREATE INDEX idx_memories_date ON public.public_memories USING btree (memory_date);

CREATE INDEX idx_notifications_user ON public.notifications USING btree (user_id);

ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT audit_log_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE ONLY public.capsule_contents
    ADD CONSTRAINT capsule_contents_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE SET NULL;


ALTER TABLE ONLY public.capsule_contents
    ADD CONSTRAINT capsule_contents_capsule_id_fkey FOREIGN KEY (capsule_id) REFERENCES public.capsules(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.capsule_files
    ADD CONSTRAINT capsule_files_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE SET NULL;


ALTER TABLE ONLY public.capsule_files
    ADD CONSTRAINT capsule_files_capsule_id_fkey FOREIGN KEY (capsule_id) REFERENCES public.capsules(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.capsule_members
    ADD CONSTRAINT capsule_members_capsule_id_fkey FOREIGN KEY (capsule_id) REFERENCES public.capsules(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.capsule_members
    ADD CONSTRAINT capsule_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.capsules
    ADD CONSTRAINT capsules_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_capsule_id_fkey FOREIGN KEY (capsule_id) REFERENCES public.capsules(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.open_conditions
    ADD CONSTRAINT open_conditions_capsule_id_fkey FOREIGN KEY (capsule_id) REFERENCES public.capsules(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.open_history
    ADD CONSTRAINT open_history_capsule_id_fkey FOREIGN KEY (capsule_id) REFERENCES public.capsules(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.open_history
    ADD CONSTRAINT open_history_opened_by_fkey FOREIGN KEY (opened_by) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.public_memories
    ADD CONSTRAINT public_memories_capsule_id_fkey FOREIGN KEY (capsule_id) REFERENCES public.capsules(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.public_memories
    ADD CONSTRAINT public_memories_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY audit_select ON public.audit_log FOR SELECT USING (((user_id = auth.uid()) OR public.is_admin()));

ALTER TABLE public.capsule_contents ENABLE ROW LEVEL SECURITY;

CREATE POLICY capsule_delete ON public.capsules FOR DELETE USING ((owner_id = auth.uid()));

ALTER TABLE public.capsule_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY capsule_insert ON public.capsules FOR INSERT WITH CHECK ((owner_id = auth.uid()));

ALTER TABLE public.capsule_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY capsule_select ON public.capsules FOR SELECT USING (((owner_id = auth.uid()) OR public.is_capsule_member(id) OR is_public));

CREATE POLICY capsule_update ON public.capsules FOR UPDATE USING (((owner_id = auth.uid()) OR public.is_capsule_editor(id))) WITH CHECK (((owner_id = auth.uid()) OR public.is_capsule_editor(id)));

ALTER TABLE public.capsules ENABLE ROW LEVEL SECURITY;

CREATE POLICY conditions_select ON public.open_conditions FOR SELECT USING (public.can_access_capsule(capsule_id));

CREATE POLICY conditions_write ON public.open_conditions USING ((public.is_capsule_owner(capsule_id) OR public.is_capsule_editor(capsule_id))) WITH CHECK ((public.is_capsule_owner(capsule_id) OR public.is_capsule_editor(capsule_id)));

CREATE POLICY contents_delete_own ON public.capsule_contents FOR DELETE USING (((author_id = auth.uid()) AND public.is_collecting(capsule_id)));

CREATE POLICY contents_insert ON public.capsule_contents FOR INSERT WITH CHECK (((author_id = auth.uid()) AND public.is_collecting(capsule_id) AND (public.is_capsule_owner(capsule_id) OR public.is_accepted_member(capsule_id))));

CREATE POLICY contents_modify_own ON public.capsule_contents FOR UPDATE USING (((author_id = auth.uid()) AND public.is_collecting(capsule_id))) WITH CHECK (((author_id = auth.uid()) AND public.is_collecting(capsule_id)));

CREATE POLICY contents_select ON public.capsule_contents FOR SELECT USING ((public.is_capsule_owner(capsule_id) OR public.is_accepted_member(capsule_id)));

CREATE POLICY files_delete_own ON public.capsule_files FOR DELETE USING (((author_id = auth.uid()) AND public.is_collecting(capsule_id)));

CREATE POLICY files_insert ON public.capsule_files FOR INSERT WITH CHECK (((author_id = auth.uid()) AND public.is_collecting(capsule_id) AND (public.is_capsule_owner(capsule_id) OR public.is_accepted_member(capsule_id))));

CREATE POLICY files_select ON public.capsule_files FOR SELECT USING ((public.is_capsule_owner(capsule_id) OR public.is_accepted_member(capsule_id)));

CREATE POLICY history_insert ON public.open_history FOR INSERT WITH CHECK ((public.can_access_capsule(capsule_id) AND (opened_by = auth.uid())));

CREATE POLICY history_select ON public.open_history FOR SELECT USING (public.can_access_capsule(capsule_id));

CREATE POLICY members_delete ON public.capsule_members FOR DELETE USING (public.is_capsule_owner(capsule_id));

CREATE POLICY members_insert ON public.capsule_members FOR INSERT WITH CHECK (public.is_capsule_owner(capsule_id));

CREATE POLICY members_select ON public.capsule_members FOR SELECT USING (((user_id = auth.uid()) OR public.is_capsule_owner(capsule_id)));

CREATE POLICY memories_delete ON public.public_memories FOR DELETE USING ((owner_id = auth.uid()));

CREATE POLICY memories_insert ON public.public_memories FOR INSERT WITH CHECK (((owner_id = auth.uid()) AND public.is_capsule_owner(capsule_id)));

CREATE POLICY memories_select ON public.public_memories FOR SELECT USING (true);

CREATE POLICY memories_write ON public.public_memories USING (public.is_capsule_owner(capsule_id)) WITH CHECK (public.is_capsule_owner(capsule_id));

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY notifications_select ON public.notifications FOR SELECT USING ((user_id = auth.uid()));

CREATE POLICY notifications_update ON public.notifications FOR UPDATE USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));

ALTER TABLE public.open_conditions ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.open_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY profile_select_own ON public.profiles FOR SELECT USING (((id = auth.uid()) OR public.is_admin()));

CREATE POLICY profile_update_own ON public.profiles FOR UPDATE USING ((id = auth.uid())) WITH CHECK ((id = auth.uid()));

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.public_memories ENABLE ROW LEVEL SECURITY;

