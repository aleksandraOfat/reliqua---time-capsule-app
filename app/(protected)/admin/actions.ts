'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function setUserActive(formData: FormData) {
    const targetId = formData.get('user_id') as string
    const active = formData.get('active') === 'true'

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    await supabase.rpc('admin_set_active', { target_id: targetId, active})
    await supabase.rpc('log_audit', {
        p_action: active ? 'admin_activate_user' : 'admin_deactivate_user',
        p_entity_type: 'user',
        p_entity_id: targetId,
    })

    revalidatePath('/admin/users')
}