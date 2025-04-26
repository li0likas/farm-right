
'use client';

import React, { useState, useEffect } from 'react';
import { LanguageProvider, useLanguage } from '@/context/LanguageContext';
import { IntlProvider } from 'next-intl';

// Import translations
import enTranslations from '@/translations/en.json';
import ltTranslations from '@/translations/lt.json';

interface LanguageProviderWrapperProps {
  children: React.ReactNode;
}

const TranslationWrapper = ({ children }: { children: React.ReactNode }) => {
  const { language } = useLanguage();
  const [messages, setMessages] = useState(language === 'lt' ? ltTranslations : enTranslations);

  useEffect(() => {
    setMessages(language === 'lt' ? ltTranslations : enTranslations);
  }, [language]);

  return (
    <IntlProvider locale={language} messages={messages}>
      {children}
    </IntlProvider>
  );
};

export default function LanguageProviderWrapper({ children }: LanguageProviderWrapperProps) {
  return (
    <LanguageProvider>
      <TranslationWrapper>{children}</TranslationWrapper>
    </LanguageProvider>
  );
}