export default function Loading() {
  return (
    <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 relative">
          <div className="absolute inset-0 border-4 border-primary-200 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-primary-600 rounded-full border-t-transparent animate-spin"></div>
        </div>
        <h2 className="text-xl font-semibold text-gray-700">Loading GiftCart Assistant...</h2>
        <p className="text-sm text-gray-500 mt-2">Please wait a moment</p>
      </div>
    </div>
  );
}
