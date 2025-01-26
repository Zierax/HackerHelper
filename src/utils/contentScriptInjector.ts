export const injectContentScript = (script: string) => {
    const scriptElement = document.createElement('script');
    scriptElement.textContent = script;
    document.documentElement.appendChild(scriptElement);
    scriptElement.remove();
  };