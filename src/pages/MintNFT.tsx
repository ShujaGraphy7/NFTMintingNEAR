import { useState, useEffect } from 'react';
import { useWalletSelector } from '../contexts/WalletSelectorContext';
import { sftMint } from '../services/near';
import type { Near } from 'near-api-js';

const MintNFT = () => {
  const [formData, setFormData] = useState({
    artistName: '',
    title: '',
    description: '',
    numberOfCopies: 1,
    price: 0.1,
  });
  const [mp3File, setMp3File] = useState<File | null>(null);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mp3PreviewUrl, setMp3PreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isTestMode] = useState(false);

  const { selector, modal, accountId, near, loading } = useWalletSelector();

  const isSignedIn = !!accountId;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverImage(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleImageDelete = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setCoverImage(null);
    setPreviewUrl(null);
  };

  const handleMp3Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMp3File(file);
      const url = URL.createObjectURL(file);
      setMp3PreviewUrl(url);
    }
  };

  const handleMp3Delete = () => {
    if (mp3PreviewUrl) {
      URL.revokeObjectURL(mp3PreviewUrl);
    }
    setMp3File(null);
    setMp3PreviewUrl(null);
  };

  const signIn = () => {
    modal.show();
  };

  const signOut = async () => {
    const wallet = await selector.wallet();
    await wallet.signOut();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSignedIn) {
      signIn();
      return;
    }
    
    if (!mp3File || !coverImage) {
      setLocalError('Please select both MP3 and cover image files');
      return;
    }

    // Validate input
    if (formData.numberOfCopies < 1) {
      setLocalError('Number of copies must be at least 1');
      return;
    }

    if (formData.price <= 0) {
      setLocalError('Price must be greater than 0');
      return;
    }

    if (!formData.title.trim()) {
      setLocalError('Title is required');
      return;
    }
    
    setIsUploading(true);
    setLocalError(null);
    
    try {
      if (isTestMode) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        setFormData({
          artistName: '',
          title: '',
          description: '',
          numberOfCopies: 1,
          price: 0.1,
        });
        setMp3File(null);
        setCoverImage(null);
        setPreviewUrl(null);
        setMp3PreviewUrl(null);
        alert('Test Mode: NFT minted successfully (simulated)!');
        return;
      }
      
      const wallet = await selector.wallet();
      if (!wallet) {
        throw new Error("Wallet not selected or unavailable.");
      }
      
      if (!near) {
        throw new Error("NEAR connection not available.");
      }
      
      const result = await sftMint(
        near,
        wallet,
        mp3File,
        coverImage,
        {
          title: formData.title.trim(),
          description: formData.description.trim(),
          copies: formData.numberOfCopies,
          price: formData.price.toString(),
        }
      );
      
      console.log("SFT Mint Result:", result);

      if (result.success) {
      setFormData({
        artistName: '',
        title: '',
        description: '',
        numberOfCopies: 1,
        price: 0.1,
      });
      
      setMp3File(null);
      setCoverImage(null);
      setPreviewUrl(null);
      setMp3PreviewUrl(null);
      
        alert('SFT minted successfully!');
      } else {
        throw new Error('Minting failed');
      }
    } catch (error) {
      console.error('Error minting SFT:', error);
      let errorMessage = 'Unknown error occurred';
      
      if (error instanceof Error) {
        // Handle specific error cases
        if (error.message.includes('insufficient deposit')) {
          errorMessage = 'Insufficient funds for storage deposit';
        } else if (error.message.includes('token class ID already exists')) {
          errorMessage = 'A token with this title already exists';
        } else {
          errorMessage = error.message;
        }
      }
      
      setLocalError(`Error minting SFT: ${errorMessage}`);
    } finally {
      setIsUploading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      if (mp3PreviewUrl) {
        URL.revokeObjectURL(mp3PreviewUrl);
      }
    };
  }, [previewUrl, mp3PreviewUrl]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="p-4 rounded-lg text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading NEAR wallet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 mb-4">
            Mint Your Music NFT
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            Transform your music into unique digital assets
          </p>
          
          {/* Wallet Connection Status */}
          <div className="flex justify-center mb-2">
            {isSignedIn ? (
              <div className="flex items-center bg-green-50 text-green-700 px-4 py-2 rounded-full border border-green-200">
                <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                <span className="mr-2 font-medium">Connected: {accountId}</span>
                <button 
                  onClick={signOut}
                  className="ml-2 text-sm bg-white hover:bg-red-50 text-red-600 px-2 py-1 rounded-md transition-colors"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={signIn}
                className="flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-full transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Connect NEAR Wallet
              </button>
            )}
          </div>
          
          {isTestMode && (
            <div className="inline-block bg-yellow-50 text-yellow-800 text-xs px-2 py-1 rounded-md border border-yellow-200">
              Test Mode Enabled
            </div>
          )}
        </div>

        {/* Error Messages */}
        {localError && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 text-red-700 border border-red-200">
            <div className="flex">
              <svg className="w-5 h-5 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="font-medium">There was an error</p>
                <p className="text-sm mt-1">{localError}</p>
                {isTestMode && (
                  <p className="text-sm mt-2">
                    Test mode is active. NFT minting will be simulated.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Main Form Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-white/20">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Title and Description */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Artist Name
                </label>
                <input
                  type="text"
                  value={formData.artistName}
                  onChange={(e) => setFormData({ ...formData, artistName: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white/50"
                  placeholder="Enter artist name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white/50"
                  placeholder="Enter your NFT title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white/50"
                  rows={4}
                  placeholder="Describe your music NFT"
                  required
                />
              </div>
            </div>

            {/* File Uploads */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <label className="block text-sm font-semibold text-gray-700">
                  MP3 File
                </label>
                <div className="flex items-center justify-center w-full">
                  {mp3PreviewUrl ? (
                    <div className="relative w-full h-32">
                      <div className="rounded-xl overflow-hidden border-2 border-indigo-200">
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 p-4">
                          {/* Audio Player */}
                          <div className="w-full mb-2">
                            <audio
                              controls
                              className="w-full"
                              src={mp3PreviewUrl}
                            >
                              Your browser does not support the audio element.
                            </audio>
                          </div>
                          
                          {/* File Name */}
                          <p className="text-sm text-gray-600 truncate w-full text-center">
                            {mp3File?.name}
                          </p>
                        </div>

                        {/* Delete Button - Fixed in top-right corner */}
                        <button
                          type="button"
                          onClick={handleMp3Delete}
                          className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-full hover:bg-white transition-colors shadow-lg hover:text-red-600"
                          title="Remove Audio"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="flex flex-col w-full h-32 border-2 border-dashed border-indigo-200 rounded-xl cursor-pointer hover:bg-indigo-50/50 transition-colors group">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <div className="w-12 h-12 mb-2 rounded-full bg-indigo-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                          </svg>
                        </div>
                        <p className="mb-2 text-sm text-gray-500">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">MP3 files only</p>
                      </div>
                      <input
                        id="mp3-upload"
                        type="file"
                        accept=".mp3"
                        onChange={handleMp3Change}
                        className="hidden"
                        required={!mp3File}
                      />
                    </label>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-semibold text-gray-700">
                  Cover Image
                </label>
                <div className="flex items-center justify-center w-full">
                  {previewUrl ? (
                    <div className="relative w-full h-32">
                      <div className="absolute inset-0 rounded-xl overflow-hidden border-2 border-dashed border-indigo-200">
                        <div className="w-full h-full flex items-center justify-center bg-gray-50">
                          <img
                            src={previewUrl}
                            alt="Cover Preview"
                            className="max-h-full max-w-full h-auto w-auto object-contain"
                          />
                        </div>
                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={handleImageDelete}
                          className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-full hover:bg-white transition-colors shadow-lg hover:text-red-600"
                          title="Remove Image"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="flex flex-col w-full h-32 border-2 border-dashed border-indigo-200 rounded-xl cursor-pointer hover:bg-indigo-50/50 transition-colors group">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <div className="w-12 h-12 mb-2 rounded-full bg-indigo-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <p className="mb-2 text-sm text-gray-500">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                      </div>
                      <input
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                        required={!coverImage}
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>

            {/* NFT Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Number of Copies
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.numberOfCopies}
                  onChange={(e) => setFormData({ ...formData, numberOfCopies: parseInt(e.target.value) || 1 })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white/50"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Price (NEAR)
                </label>
                  <input
                    type="number"
                  step="0.01"
                  min="0.01"
                    value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0.1 })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white/50"
                    required
                  />
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isUploading}
                className={`w-full py-4 px-6 rounded-xl text-white font-semibold transition-all
                  ${isUploading
                    ? 'bg-indigo-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700'
                  }`}
              >
                {isUploading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Minting NFT...
                  </div>
                ) : (
                  isSignedIn ? 'Mint NFT' : 'Connect Wallet to Mint'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MintNFT;