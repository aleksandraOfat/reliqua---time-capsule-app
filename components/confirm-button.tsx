'use client'

export default function ConfirmButton({
                                          children,
                                          className,
                                          message,
                                      }: {
    children: React.ReactNode
    className?: string
    message:string
}) {
    return (
        <button
            type="submit"
            className={className}
            onClick={(e) => {
                if (!confirm(message)) e.preventDefault()
            }}
        >
            {children}
        </button>
    )
}