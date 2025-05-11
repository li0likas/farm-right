// Localization utilities for Cypress tests

// Define text translations for UI elements
interface Translations {
  [key: string]: {
    en: string;
    lt: string;
  };
}

// Dictionary of common UI elements with their translations
export const textTranslations: Translations = {
  // Auth/Login page
  'welcomeBack': {
    en: 'Welcome Back',
    lt: 'Sveiki sugrįžę'
  },
  'signIn': {
    en: 'Sign In',
    lt: 'Prisijungti'
  },
  'username': {
    en: 'Username',
    lt: 'Vartotojo vardas'
  },
  'password': {
    en: 'Password',
    lt: 'Slaptažodis'
  },
  'rememberMe': {
    en: 'Remember me',
    lt: 'Prisiminti mane'
  },
  'emptyFields': {
    en: 'There are empty fields',
    lt: 'Yra tuščių laukų'
  },
  'incorrectCredentials': {
    en: 'Incorrect credentials',
    lt: 'Neteisingi prisijungimo duomenys'
  },

  // Dashboard
  'dashboard': {
    en: 'Dashboard',
    lt: 'Valdymo skydelis'
  },
  'aiSummary': {
    en: 'AI Summary',
    lt: 'AI Santrauka'
  },
  'taskCompletion': {
    en: 'Task Completion',
    lt: 'Užduočių Atlikimas'
  },
  'totalFieldArea': {
    en: 'Total Field Area',
    lt: 'Bendras Laukų Plotas'
  },
  'tasksTimeline': {
    en: 'Tasks timeline',
    lt: 'Užduočių laiko juosta'
  },

  // Fields
  'fields': {
    en: 'Fields',
    lt: 'Laukai'
  },
  'myFields': {
    en: 'My Fields',
    lt: 'Mano Laukai'
  },
  'moreInfo': {
    en: 'More Info',
    lt: 'Daugiau informacijos'
  },

  // Tasks
  'tasks': {
    en: 'Tasks',
    lt: 'Užduotys'
  },
  'createTask': {
    en: 'Create Task',
    lt: 'Sukurti užduotį'
  },
  'pending': {
    en: 'Pending',
    lt: 'Suplanuotos'
  },
  'completed': {
    en: 'Completed',
    lt: 'Užbaigtos'
  },
  'canceled': {
    en: 'Canceled',
    lt: 'Atšauktos'
  },
  'all': {
    en: 'All',
    lt: 'Visos'
  }
};

/**
 * Gets the appropriate text based on the current app language
 * @param key The key for the text you want to get
 * @param defaultLang Optional default language to use if detection fails
 */
export const getText = (key: string, defaultLang: 'en' | 'lt' = 'en'): string => {
  // Helper function that would determine the current app language
  const detectAppLanguage = (): 'en' | 'lt' => {
    // Attempt to get the language from localStorage
    return cy.window().then(win => {
      const storedLang = win.localStorage.getItem('language');
      return (storedLang === 'lt') ? 'lt' : 'en';
    });
  };

  if (!textTranslations[key]) {
    // If key doesn't exist, return the key itself (fallback)
    return key;
  }

  // Function to get the text in the correct language
  const getTextForLanguage = (lang: 'en' | 'lt') => {
    return textTranslations[key][lang];
  };

  // Return a Cypress chain that resolves to the translated text
  return cy.window().then(win => {
    const lang = win.localStorage.getItem('language') as 'en' | 'lt' || defaultLang;
    return getTextForLanguage(lang);
  });
};

/**
 * Gets a Cypress selector function that will work with either language
 * @param key The key for the text you want to get a selector for
 */
export const getTextSelector = (key: string) => {
  if (!textTranslations[key]) {
    // If key doesn't exist, return the key itself as a literal string matcher
    return new RegExp(key);
  }
  
  // Return a regex that matches either the English or Lithuanian version
  const enText = textTranslations[key].en;
  const ltText = textTranslations[key].lt;
  return new RegExp(`(${enText}|${ltText})`);
};

/**
 * Finds an element by its text content in any supported language
 * @param key The key for the text to find
 */
export const findByText = (key: string) => {
  const selector = getTextSelector(key);
  return cy.contains(selector);
};

/**
 * Custom command to get a button by its text in any language
 * @param key The translation key for the button text
 */
Cypress.Commands.add('getButtonByText', (key: string) => {
  const selector = getTextSelector(key);
  return cy.get('button').contains(selector);
});

// Add TypeScript definitions
declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to get a button by its text in any language
       */
      getButtonByText(key: string): Chainable<JQuery<HTMLElement>>;
    }
  }
}