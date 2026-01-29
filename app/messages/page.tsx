export default function MessagesPage() {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8 text-muted-foreground">
            <div className="bg-muted/50 p-6 rounded-full mb-4">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="48"
                    height="48"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2">Your Messages</h2>
            <p>Select a conversation to start chatting.</p>
        </div>
    );
}
