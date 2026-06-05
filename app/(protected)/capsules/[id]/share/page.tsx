import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ShareForm from './share-form'

export default async function SharePage({
                                            params,
                                        }: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data: capsule } = await supabase
        .from('capsules')
        .select('id, title, owner_id, status')
        .eq('id', id)
        .maybeSingle()

    if (!capsule) notFound()
    if (capsule.owner_id !== user?.id){
        redirect(`/capsules/${id}`)
    }

    return <ShareForm capsuleId={capsule.id} defaultTitle={capsule.title} />
}