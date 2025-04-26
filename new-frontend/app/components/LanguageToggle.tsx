'use client';

import React from 'react';
import { Button } from 'primereact/button';
import { useLanguage } from '@/context/LanguageContext';

const LanguageToggle: React.FC = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex gap-1">
      <Button
        label="EN"
        className={`p-button-sm ${language === 'en' ? 'p-button-outlined p-button-primary' : 'p-button-text'}`}
        onClick={() => setLanguage('en')}
      />
      <Button
        label="LT"
        className={`p-button-sm ${language === 'lt' ? 'p-button-outlined p-button-primary' : 'p-button-text'}`}
        onClick={() => setLanguage('lt')}
      />
    </div>
  );
};

export default LanguageToggle;