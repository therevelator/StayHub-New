import React from 'react';
import { useRouteError, Link } from 'react-router-dom';

export default function ErrorBoundary() {
  const error = useRouteError();
  console.error(error);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Oops!</h1>
        <p className="text-lg text-gray-600 mb-6">
          {error.status === 404
            ? "The page you're looking for doesn't exist."
            : "Sorry, an unexpected error has occurred."}
        </p>
        <p className="text-gray-500 mb-8">
          {error.statusText || error.message}
        </p>
        <Link
          to="/"
          className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
        >
          Go back home
        </Link>
      </div>
    </div>
  );
} 