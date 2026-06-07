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

    revalidatePath('/admin/users')
}