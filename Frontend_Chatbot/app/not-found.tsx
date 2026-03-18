export default function NotFound() {
  return (
    <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white">
      <div className="text-center max-w-md px-4">
        <div className="text-6xl mb-4">🎁</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Page Not Found</h2>
        <p className="text-gray-600 mb-6">
          The page you're looking for doesn't exist.
        </p>
        <a
          href="/"
          className="inline-block px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg font-medium hover:from-primary-600 hover:to-primary-700 transition-all shadow-md hover:shadow-lg"
        >
          Go to Chat
        </a>
      </div>
    </div>
  );
}
