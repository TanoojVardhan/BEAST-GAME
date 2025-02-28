import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <div className="max-w-4xl w-full space-y-8">
        {/* Beast Games Title Section */}
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-red-600">
            Beast Games
          </h1>
          <p className="text-xl text-gray-300">
            Challenge yourself in the ultimate test of skill and strength
          </p>
        </div>
        
        {/* Action Button */}
        <div className="flex justify-center">
          <Link 
            href="/dashboard/games"
            className="px-8 py-4 bg-red-600 hover:bg-red-700 rounded-lg text-xl font-bold transition-all transform hover:scale-105 shadow-lg"
          >
            Enter the Arena →
          </Link>
        </div>
      </div>
    </div>
  );
}