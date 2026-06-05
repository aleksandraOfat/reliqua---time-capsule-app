import {createClient} from '@/lib/supabase/server'
import {NextResponse} from 'next/server'

export async function GET(request: Request) {
    const secret = request.headers.get('x-cron-secret')
    if (secret !== process.env.CRON_SECRET){
        return new NextResponse('Unauthorized', { status: 401 })
    }

    const supabase = await createClient()
    const {error} = await supabase.rpc('process_capsule_lifecycle')

    if (error) {
        return NextResponse.json({ok: false, error:error.message }, { status: 500 })
    }
    return NextResponse.json({ok: true})
}