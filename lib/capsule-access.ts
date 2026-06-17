export type CapsuleStatus = 'collecting' | 'sealed' | 'ready' | 'opened'

export function canAccessCapsuleFile(params: {
    status: string
    isOwner: boolean
    isAcceptedMember: boolean
}): boolean {
    const { status, isOwner, isAcceptedMember } = params

    if (status === 'opened') return true

    if (status === 'collecting') {
        return isOwner || isAcceptedMember
    }

    return false
}