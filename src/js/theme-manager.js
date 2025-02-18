class ThemeManager {
  constructor() {
    this.themeSelect = document.getElementById('themeSelect');
    this.themePreview = document.getElementById('themePreview');
    this.currentTheme = 'classic';
    this.themes = null;
    
    this.init();
  }

  init() {
    this.loadThemes();
    this.bindEvents();
  }

  async loadThemes() {
    try {
      const response = await fetch('../src/data/themes.json');
      if (!response.ok) throw new Error('Failed to load themes');
      this.themes = await response.json();
      this.populateThemeSelector();
      this.applyTheme(this.currentTheme);
    } catch (error) {
      console.warn('Using fallback themes:', error);
      // Fallback themes if JSON fails to load
      this.themes = {
        classic: {
          label: "Classic (Professional)",
          primary: "#2C3E50",
          textOnPrimary: "#FFFFFF"
        }
        // ...other fallback themes
      };
    }
  }

  populateThemeSelector() {
    this.themeSelect.innerHTML = Object.entries(this.themes)
      .map(([key, theme]) => `
        <option value="${key}">${theme.label}</option>
      `)
      .join('');
  }

  bindEvents() {
    this.themeSelect.addEventListener('change', (e) => {
      this.applyTheme(e.target.value);
    });
  }

  applyTheme(themeName) {
    document.body.className = `theme-${themeName}`;
    this.currentTheme = themeName;
    this.updatePreview();
  }

  updatePreview() {
    const theme = this.themes[this.currentTheme];
    if (theme) {
      this.themePreview.style.backgroundColor = theme.primary;
      this.themePreview.style.color = theme.textOnPrimary;
    }
  }
}

// Initialize only after DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  window.themeManager = new ThemeManager();
});
