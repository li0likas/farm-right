'use client';

import React from 'react';
import LanguageProviderWrapper from './LanguageProviderWrapper';

import LandingPageContent from './(full-page)/landing/page';

export default function HomePage() {
  return (
    <LanguageProviderWrapper>
      <LandingPageContent />
    </LanguageProviderWrapper>
  );
}