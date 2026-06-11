export type CapsuleLifecycleState = 'collecting' | 'sealed' | 'ready' | 'opened'

export function deriveCapsuleState(params: {
    status: string
    openDateMs: number | null
    now: number
}): CapsuleLifecycleState {
    const { status, openDateMs, now } = params
    if (status === 'opened') return 'opened'
    if (status === 'collecting') return 'collecting'
    if (openDateMs !== null && openDateMs <= now) return 'ready'
    return 'sealed'
}