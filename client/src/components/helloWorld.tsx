import { useState, useEffect } from 'react';
import { getHelloWorld, saveGoogleAccessToken } from '../apiController/controller';
import { type MondayUser } from '../constants/cosntant';
import { useGoogleAuth } from '../Authentication/googleConnection';

const HelloWorld = () => {
  const [message, setMessage] = useState<string>('');
  const [mondayUser, setMondayUser] = useState<MondayUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [googleAuthLoading, setGoogleAuthLoading] = useState<boolean>(false);
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);
  const { handleGoogleAuth } = useGoogleAuth();

  useEffect(() => {
    const fetchMessage = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getHelloWorld();
        setMessage(response.message);
        setMondayUser(response.mondayUser);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch message');
      } finally {
        setLoading(false);
      }
    };

    fetchMessage();
  }, []);

  const handleContinueWithGoogle = async () => {
    setGoogleAuthLoading(true);
    setError(null);
    
    await handleGoogleAuth(
      async (accessToken) => {
        setGoogleAccessToken(accessToken);
        console.log('Google OAuth successful! Access token received.');
        
        // Send access token to backend
        try {
          await saveGoogleAccessToken(accessToken);
          console.log('Google access token saved to backend successfully');
        } catch (err) {
          console.error('Failed to save Google access token to backend:', err);
          setError(err instanceof Error ? err.message : 'Failed to save access token');
        } finally {
          setGoogleAuthLoading(false);
        }
      },
      (errorMessage) => {
        setError(errorMessage);
        setGoogleAuthLoading(false);
        console.error('Google OAuth error:', errorMessage);
      }
    );
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error && !googleAuthLoading) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <h1>{message}</h1>
      {mondayUser && (
        <div style={{ marginTop: '20px', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
          <h2>Monday.com User Details</h2>
          <div style={{ marginTop: '15px' }}>
            <p><strong>Name:</strong> {mondayUser.name}</p>
            <p><strong>Email:</strong> {mondayUser.email}</p>
            <p><strong>ID:</strong> {mondayUser.id}</p>
            <p><strong>Is Admin:</strong> {mondayUser.is_admin ? 'Yes' : 'No'}</p>
            {mondayUser.photo_thumb && (
              <div>
                <strong>Photo:</strong>
                <img 
                  src={mondayUser.photo_thumb} 
                  alt={mondayUser.name}
                  style={{ width: '50px', height: '50px', borderRadius: '50%', marginLeft: '10px' }}
                />
              </div>
            )}
          </div>
        </div>
      )}
      {!mondayUser && (
        <div style={{ marginTop: '20px', color: '#666' }}>
          No Monday.com user details available
        </div>
      )}

      <div style={{ marginTop: '30px', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
        <h2>Google Drive Integration</h2>
        <button
          onClick={handleContinueWithGoogle}
          disabled={googleAuthLoading}
          style={{
            marginTop: '15px',
            padding: '12px 24px',
            fontSize: '16px',
            backgroundColor: '#4285f4',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: googleAuthLoading ? 'not-allowed' : 'pointer',
            opacity: googleAuthLoading ? 0.6 : 1,
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}
        >
          {googleAuthLoading ? (
            <>
              <span>Connecting...</span>
            </>
          ) : (
            <>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span>Continue with Google</span>
            </>
          )}
        </button>
        
        {googleAccessToken && (
          <div style={{ marginTop: '20px', padding: '15px', background: '#f0f8ff', borderRadius: '4px' }}>
            <p style={{ color: '#34A853', fontWeight: 'bold' }}>✓ Successfully connected to Google!</p>
            <p style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
              Access Token: {googleAccessToken.substring(0, 20)}...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HelloWorld;
