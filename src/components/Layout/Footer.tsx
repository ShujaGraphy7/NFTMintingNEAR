import nearLogo from '../../assets/near_logo.svg';

const Footer = () => {
  return (
    <footer className="bg-white/80 backdrop-blur-sm border-t border-cyan-100/20 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center space-x-3">
          <p className="text-base text-cyan-900 flex items-center">
            Powered by{' '}
            <a
              href="https://near.org"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 transition-colors"
            >
              <img
                src={nearLogo}
                alt="NEAR Protocol"
                className="h-7 ml-2 transition-transform hover:scale-110"
              />
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 