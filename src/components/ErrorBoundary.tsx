import React from 'react';

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message || 'Something went wrong.' };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FAF9F5] text-[#1C241E] flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-white border border-[#DDE3D7] rounded-2xl p-8 space-y-4">
            <h2 className="font-serif text-2xl font-semibold">We hit a small snag</h2>
            <p className="text-sm text-[#525C54] leading-relaxed">
              Please reload the page to continue your Skin Fit Test or browse products.
            </p>
            <p className="text-xs font-mono text-[#525C54] bg-[#F1F3EE] p-3 rounded-lg break-words">
              {this.state.message}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 rounded-lg bg-[#DF5A47] text-white text-sm font-semibold hover:bg-[#C84A38] transition-colors"
            >
              Reload App
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
