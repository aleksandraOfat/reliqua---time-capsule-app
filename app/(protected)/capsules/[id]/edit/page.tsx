import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import EditMetaForm from './edit-form'

export default async function EditCapsulePage({
                                                  params,
                                              }: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params

    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    const { data: capsule } = await supabase
        .from('capsules')
        .select('id, title, description, owner_id, status')
        .eq('id', id)
        .maybeSingle()

    if (!capsule) {
        notFound()
    }

    if (capsule.owner_id !== user?.id || capsule.status === 'collecting') {
        redirect(`/capsules/${id}`)
    }

    return (
        <EditMetaForm
            capsuleId={capsule.id}
            initialTitle={capsule.title}
            initialDescription={capsule.description ?? ''}
        />
    )
}