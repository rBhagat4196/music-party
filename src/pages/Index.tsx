import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-spotify-dark to-black flex flex-col items-center justify-center p-4">
      <div className="max-w-3xl w-full text-center">
        <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-spotify-green to-spotify-purple">
          Spotify Jam Session
        </h1>
        
        <p className="text-xl md:text-2xl text-spotify-subtext mb-8">
          Create and join interactive music listening rooms with voice chat and real-time synchronization.
        </p>
        
        <div className="flex gap-4 justify-center">
          <Button
            onClick={() => navigate('/jam-session')}
            className="bg-spotify-green hover:bg-spotify-light-green text-black text-lg font-medium py-6 px-8 rounded-full transform hover:scale-105 transition-all duration-300"
          >
            Start Jamming
          </Button>
          
          <Button
            onClick={() => navigate('/dashboard')}
            className="bg-spotify-dark-highlight hover:bg-spotify-dark-elevated text-white text-lg font-medium py-6 px-8 rounded-full transform hover:scale-105 transition-all duration-300 border border-spotify-dark-highlight"
          >
            Manage Music
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
          <div className="bg-spotify-dark-elevated border-spotify-dark-highlight p-6 rounded-lg">
            <div className="h-12 w-12 bg-spotify-purple/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-spotify-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Synchronized Playback</h3>
            <p className="text-spotify-subtext">Listen to the same songs at the same time, with playback synced across all devices.</p>
          </div>
          
          <div className="bg-spotify-dark-elevated border-spotify-dark-highlight p-6 rounded-lg">
            <div className="h-12 w-12 bg-spotify-green/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-spotify-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Voice Chat</h3>
            <p className="text-spotify-subtext">Talk with your friends in real-time while enjoying music together.</p>
          </div>
          
          <div className="bg-spotify-dark-elevated border-spotify-dark-highlight p-6 rounded-lg">
            <div className="h-12 w-12 bg-spotify-purple/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-spotify-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Collaborative Queue</h3>
            <p className="text-spotify-subtext">Add songs to the shared queue and take turns being the DJ.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;