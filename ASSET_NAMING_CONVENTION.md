# Asset File Structure & Naming Convention

## 📁 Folder Structure

```
frontend/src/assets/
├── illustrations/      (Main UI illustrations)
├── backgrounds/        (Background images & gradients)
├── logos/             (App logos & branding)
└── avatars/           (User avatar placeholders)
```

---

## 📌 Naming Convention Rules

1. **Use kebab-case** (lowercase with hyphens, no spaces)
2. **Be descriptive** (what the image shows)
3. **Include dimensions** in filename if different sizes
4. **Use consistent prefixes** for organization

---

## 🎨 Illustrations Folder

### File Naming Pattern: `{feature}-{type}.{ext}`

| File Name | Description | Dimensions | Type |
|-----------|-------------|-----------|------|
| `hero-developers-collaboration.png` | Hero section: Two developers coding together | 1600x600px | PNG |
| `hero-developers-collaboration@2x.png` | Hero section (2x for Retina) | 3200x1200px | PNG |
| `matching-avatars-connecting.png` | Matching screen with 3 avatars & lines | 800x600px | PNG |
| `waiting-interviewer-calendar.png` | Waiting screen: Person at desk with calendar | 600x500px | PNG |
| `unavailable-interviewer-handshake.png` | Fallback match: Handshake illustration | 600x500px | PNG |
| `celebration-partnership-high-five.png` | Success: People celebrating | 400x400px | PNG |
| `interview-room-setup.png` | Interview room with video setup | 1200x800px | PNG |
| `profile-editing-illustration.png` | User editing profile | 600x500px | PNG |
| `feedback-stars-rating.png` | Feedback system with stars | 500x400px | PNG |
| `404-not-found-illustration.png` | 404 error page | 600x600px | PNG |
| `empty-state-no-interviews.png` | Empty state for no interviews | 500x400px | PNG |

---

## 🌅 Backgrounds Folder

### File Naming Pattern: `bg-{location}-{style}.{ext}`

| File Name | Description | Usage |
|-----------|-------------|-------|
| `bg-gradient-hero-purple-blue.svg` | Gradient mesh for hero | Hero section |
| `bg-gradient-card-dark.svg` | Subtle gradient for cards | Card backgrounds |
| `bg-particles-animated.svg` | Floating particles | Matching screen |
| `bg-grid-pattern.svg` | Subtle grid | Background pattern |
| `bg-blob-shapes.svg` | Animated blobs | Decorative elements |
| `bg-dark-navy.png` | Solid dark background | Fallback |

---

## 🏢 Logos Folder

### File Naming Pattern: `logo-{variant}.{ext}`

| File Name | Description | Dimensions | Type |
|-----------|-------------|-----------|------|
| `logo-peerprep-horizontal.png` | Full logo horizontal | 400x100px | PNG |
| `logo-peerprep-icon.png` | Icon only (app icon) | 512x512px | PNG |
| `logo-peerprep-icon-white.png` | Icon white version | 512x512px | PNG |
| `logo-peerprep-icon-dark.png` | Icon dark version | 512x512px | PNG |
| `logo-peerprep-horizontal-white.png` | Logo white version | 400x100px | PNG |
| `logo-peerprep-vertical.png` | Logo vertical stacked | 200x300px | PNG |

---

## 👤 Avatars Folder

### File Naming Pattern: `avatar-{type}-{variant}.png`

| File Name | Description | Dimensions | Type |
|-----------|-------------|-----------|------|
| `avatar-placeholder-male-1.png` | Male placeholder avatar | 200x200px | PNG |
| `avatar-placeholder-male-2.png` | Male placeholder avatar | 200x200px | PNG |
| `avatar-placeholder-female-1.png` | Female placeholder avatar | 200x200px | PNG |
| `avatar-placeholder-female-2.png` | Female placeholder avatar | 200x200px | PNG |
| `avatar-placeholder-neutral.png` | Neutral/generic avatar | 200x200px | PNG |
| `avatar-default-icon.svg` | Default user icon | 64x64px | SVG |
| `avatar-interviewer-badge.svg` | Interviewer badge | 48x48px | SVG |

---

## 📝 Complete File Placement Guide

### Step 1: Illustrations
Place your generated images in:
```
frontend/src/assets/illustrations/
├── hero-developers-collaboration.png
├── matching-avatars-connecting.png
├── waiting-interviewer-calendar.png
├── unavailable-interviewer-handshake.png
├── celebration-partnership-high-five.png
└── (other illustration files)
```

### Step 2: Logo
Place your app logo in:
```
frontend/src/assets/logos/
├── logo-peerprep-horizontal.png
├── logo-peerprep-icon.png
└── logo-peerprep-icon-white.png
```

### Step 3: Backgrounds (Optional)
```
frontend/src/assets/backgrounds/
├── bg-gradient-hero-purple-blue.svg
└── (background files)
```

### Step 4: Avatars
```
frontend/src/assets/avatars/
├── avatar-placeholder-male-1.png
├── avatar-placeholder-female-1.png
└── avatar-placeholder-neutral.png
```

---

## 💻 How to Import in React

### Example: Using illustration in Home.jsx

```jsx
import heroImage from '../assets/illustrations/hero-developers-collaboration.png';

export default function Home() {
  return (
    <div>
      <img 
        src={heroImage} 
        alt="Developers collaborating on code"
        className="w-full object-cover rounded-lg"
      />
    </div>
  );
}
```

### Example: Using logo in Header.jsx

```jsx
import logo from '../assets/logos/logo-peerprep-icon.png';

export default function Header() {
  return (
    <header>
      <img src={logo} alt="PeerPrep Logo" className="h-12 w-12" />
    </header>
  );
}
```

### Example: Using in Tailwind with URL

```jsx
<div 
  className="bg-cover bg-center"
  style={{
    backgroundImage: `url(/src/assets/illustrations/hero-developers-collaboration.png)`
  }}
>
  {/* Content */}
</div>
```

---

## ⚙️ Configuration File (Optional)

Create `frontend/src/config/assets.js`:

```javascript
export const ASSETS = {
  illustrations: {
    heroDevelopers: '/src/assets/illustrations/hero-developers-collaboration.png',
    matchingAvatars: '/src/assets/illustrations/matching-avatars-connecting.png',
    waitingInterviewer: '/src/assets/illustrations/waiting-interviewer-calendar.png',
    unavailableInterviewer: '/src/assets/illustrations/unavailable-interviewer-handshake.png',
    celebration: '/src/assets/illustrations/celebration-partnership-high-five.png',
  },
  logos: {
    icon: '/src/assets/logos/logo-peerprep-icon.png',
    horizontal: '/src/assets/logos/logo-peerprep-horizontal.png',
    white: '/src/assets/logos/logo-peerprep-horizontal-white.png',
  },
  avatars: {
    malePlaceholder1: '/src/assets/avatars/avatar-placeholder-male-1.png',
    femalePlaceholder1: '/src/assets/avatars/avatar-placeholder-female-1.png',
    neutral: '/src/assets/avatars/avatar-placeholder-neutral.png',
  },
};
```

Then use in components:

```jsx
import { ASSETS } from '../config/assets';

export default function Hero() {
  return <img src={ASSETS.illustrations.heroDevelopers} alt="Hero" />;
}
```

---

## 📋 Checklist

- [ ] Created `frontend/src/assets/` folders
- [ ] Placed illustrations in `illustrations/` folder
- [ ] Placed logo files in `logos/` folder
- [ ] Placed background files in `backgrounds/` folder (if any)
- [ ] Placed avatar files in `avatars/` folder (if any)
- [ ] All files follow naming convention (kebab-case)
- [ ] PNG files have transparent background (where applicable)
- [ ] Images are optimized for web (compressed)

---

## 🎯 File Size Guidelines

- **Illustrations**: 200-500 KB each
- **Logos**: 50-150 KB
- **Avatars**: 20-50 KB each
- **Backgrounds**: 100-300 KB

Use tools to optimize:
- [TinyPNG](https://tinypng.com/) - Compress PNG images
- [ImageOptim](https://imageoptim.com/) - Batch optimization
- [SVGO](https://github.com/svg/svgo) - Optimize SVG files

---

## ✅ You're Ready!

Once you place the images following this structure and naming convention, they'll be ready to use in your React components. All folder structure is already created!
