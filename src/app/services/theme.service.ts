import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';

export type ThemeMode = 'system' | 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private static readonly STORAGE_KEY = 'app_theme';

  private currentModeSubject = new BehaviorSubject<ThemeMode>('system');
  public currentMode$: Observable<ThemeMode> = this.currentModeSubject.asObservable();

  private isDarkSubject = new BehaviorSubject<boolean>(false);
  public isDark$: Observable<boolean> = this.isDarkSubject.asObservable();

  private mediaQueryList: MediaQueryList | null = null;
  private mediaQueryListener: ((e: MediaQueryListEvent) => void) | null = null;

  constructor(private ngZone: NgZone) {
    this.initTheme();
  }

  /**
   * Initializes the theme on application bootstrap.
   * Default mode is 'system' unless the user previously chose 'light' or 'dark'.
   */
  private initTheme(): void {
    const saved = (localStorage.getItem(ThemeService.STORAGE_KEY) as ThemeMode) || 'system';
    const validMode: ThemeMode = ['system', 'light', 'dark'].includes(saved) ? saved : 'system';
    this.currentModeSubject.next(validMode);

    if (typeof window !== 'undefined' && window.matchMedia) {
      this.mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)');
      this.mediaQueryListener = (e: MediaQueryListEvent) => {
        if (this.currentModeSubject.value === 'system') {
          this.ngZone.run(() => {
            this.applyTheme(e.matches);
          });
        }
      };

      try {
        this.mediaQueryList.addEventListener('change', this.mediaQueryListener);
      } catch {
        // Fallback for older browsers
        this.mediaQueryList.addListener(this.mediaQueryListener);
      }
    }

    // Apply the initial theme
    const isDark = this.resolveIsDark(validMode);
    this.applyTheme(isDark);
  }

  /**
   * Sets the theme mode ('system', 'light', or 'dark') and saves it to localStorage.
   */
  public setTheme(mode: ThemeMode): void {
    localStorage.setItem(ThemeService.STORAGE_KEY, mode);
    this.currentModeSubject.next(mode);
    const isDark = this.resolveIsDark(mode);
    this.applyTheme(isDark);
  }

  /**
   * Cycles to the next theme: system -> dark -> light -> system
   */
  public cycleTheme(): ThemeMode {
    const current = this.currentModeSubject.value;
    let next: ThemeMode = 'system';
    if (current === 'system') next = 'dark';
    else if (current === 'dark') next = 'light';
    else next = 'system';

    this.setTheme(next);
    return next;
  }

  /**
   * Returns the current theme mode setting.
   */
  public get currentMode(): ThemeMode {
    return this.currentModeSubject.value;
  }

  /**
   * Returns whether dark mode is currently active.
   */
  public get isDark(): boolean {
    return this.isDarkSubject.value;
  }

  /**
   * Resolves whether the mode translates to dark mode based on system settings.
   */
  private resolveIsDark(mode: ThemeMode): boolean {
    if (mode === 'dark') return true;
    if (mode === 'light') return false;
    // 'system' mode: inspect OS preference
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  }

  /**
   * Applies the dark / light classes, Bootstrap theme, and Capacitor status bar.
   */
  private applyTheme(isDark: boolean): void {
    this.isDarkSubject.next(isDark);

    if (typeof document !== 'undefined') {
      const root = document.documentElement;

      // 1. Ionic Dark Palette Class
      root.classList.toggle('ion-palette-dark', isDark);

      // 2. Bootstrap 5.3 Dark Mode Theme Attribute
      root.setAttribute('data-bs-theme', isDark ? 'dark' : 'light');

      // 3. Custom helper attribute and CSS color scheme
      root.setAttribute('data-theme', isDark ? 'dark' : 'light');
      root.style.colorScheme = isDark ? 'dark' : 'light';
    }

    // 4. Capacitor Status Bar on Android & iOS
    if (Capacitor.isNativePlatform()) {
      try {
        StatusBar.setStyle({
          style: isDark ? Style.Dark : Style.Light
        }).catch(() => {});

        StatusBar.setBackgroundColor({
          color: isDark ? '#121212' : '#ffffff'
        }).catch(() => {});
      } catch (e) {
        // Status bar plugin might not be initialized yet, ignore
      }
    }
  }
}
