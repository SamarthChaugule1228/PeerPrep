# PeerPrep UI/UX Design Prompt

## Overall Design System

### Color Palette
- **Primary Gradient**: Purple to Blue (`#667eea` to `#764ba2`)
- **Secondary Gradient**: Blue to Cyan (for accents)
- **Background**: Dark (`#0f172a` or `#1a1f3a`)
- **Card Background**: Dark with slight transparency (`#1e293b`)
- **Text Primary**: White (`#ffffff`)
- **Text Secondary**: Light Gray (`#94a3b8`)
- **Accent**: Bright Purple/Magenta (`#a855f7`)
- **Success**: Emerald/Green (`#10b981`)

### Typography
- **Headlines**: Bold, Large (32-48px) - Sans-serif (Poppins, Inter, or similar)
- **Subheadings**: Semi-bold (20-24px)
- **Body**: Regular (14-16px)
- **Buttons**: Semi-bold (16px)

### Components
- Rounded corners: `rounded-lg` to `rounded-2xl`
- Shadows: Soft, layered shadows for depth
- Glassmorphism: Semi-transparent cards with backdrop blur
- Animations: Smooth transitions (300ms), subtle scaling effects

---

## Page-Specific Requirements

### 1. Home/Landing Page
**Layout**: Hero section with split design
- Left side: Text, CTA buttons
- Right side: Animated illustration of two people coding together

**Key Elements**:
- "Practice Interviews. Get Better. Together." headline
- 3 feature cards below (Smart Matching, Real-time Sessions, Feedback & Growth)
- Two CTA buttons: "Start Instant Interview" & "Schedule Interview"
- Animated floating code blocks/icons
- Gradient animated background with shapes

**Background Elements Needed**:
- Gradient mesh background
- Floating geometric shapes (circles, squares, lines)
- Code/bracket icons
- People collaborating illustration

---

### 2. Matching Screen
**Layout**: Centered card with animated elements
- Large "Matching..." heading
- "Finding the best match for you" subtext
- 3 animated circular avatar placeholders
- Connecting lines between avatars
- Animated dots indicating loading

**Background Elements Needed**:
- Dark gradient background
- Subtle animated particles or dots
- Profile placeholder avatars (generic user icons)

---

### 3. Waiting for Interviewer Screen
**Layout**: Split view or centered
- Calendar icon with date
- Clock icon with time
- User avatars
- "We are looking for an available interviewer"
- Skills/tags (DSA, Java, Medium)

**Background Elements Needed**:
- Soft gradient background
- Calendar illustration (optional)
- Clock illustration
- Profile pictures/avatars

---

### 4. Interviewer Unavailable/Fallback Matching Screen
**Layout**: Centered card
- Handshake/connection illustration
- Message: "We couldn't find an interviewer... matched you with another candidate"
- "You can practice together!" subtext
- "Enter Session" button
- Avatar circles for both candidates

**Background Elements Needed**:
- Handshake/partnership illustration
- Connected user avatars
- Success checkmark icon

---

### 5. Dashboard Page
**Layout**: Sidebar + Main content
- Left sidebar: Navigation menu (Dashboard, Find Interview, My Interviews, Scheduled, etc.)
- Top header: Greeting, notification bell, profile avatar
- Main content: Stats cards, Upcoming interviews list

**Stats Cards Show**:
- Upcoming Interviews (2)
- Waiting Matches (1)
- Completed Interviews (12)

**Upcoming Interviews Section**:
- Interview type badge (Instant, Scheduled)
- Topic (DSA Mock Interview, System Design, etc.)
- Date/time
- Interviewer name
- Action buttons (Join Now, View)

**Background Elements Needed**:
- Icons for each section (dashboard, search, calendar, feedback, user)
- Interview type badges
- Status indicators
- User profile placeholders

---

## Illustration/Asset Sources (Recommended)

### For Getting Assets from Gemini/GPT:

Prompt to use:
```
Generate high-quality illustrations in a modern, minimalist style for a tech interview platform:

1. Two developers collaborating on code
   - One person typing, one reviewing
   - Modern laptops, code visible on screens
   - Gradient background (purple to blue)
   - Style: Clean, flat design or semi-3D

2. Person waiting with calendar and clock
   - Sitting at desk
   - Calendar in background
   - Clock showing time
   - Patient, positive expression
   - Style: Minimalist, modern

3. Two people giving handshake
   - Representing partnership/matching
   - Celebration/success vibe
   - Gradient background
   - Style: Minimalist, modern

4. Animated loading/matching state
   - 3 user avatars with connecting lines
   - Pulsing or animated elements
   - Dark background
   - Style: Tech-forward, modern

Use color palette: Purple (#667eea), Blue (#764ba2), Emerald (#10b981)
Format: PNG with transparent background or high quality
Style: Modern, flat design, professional
```

### Specific Assets Needed:

#### Illustrations (from Gemini/GPT/Figma)
- [ ] Hero section: Two developers coding together (1600x600px or wider)
- [ ] Matching animation: User avatars with connecting lines (800x600px)
- [ ] Waiting state: Person at desk with calendar/clock (600x500px)
- [ ] Interviewer unavailable: Handshake between two people (600x500px)
- [ ] Partnership celebration: Two people high-fiving (400x400px)

#### Icons (can use Lucide React - already installed)
- [ ] Dashboard icon
- [ ] Search/Find icon
- [ ] Calendar icon
- [ ] Feedback icon
- [ ] User/Profile icon
- [ ] Settings icon
- [ ] Logout icon
- [ ] Bell (notifications)
- [ ] Video call icon
- [ ] Chat icon
- [ ] Clock icon
- [ ] Check mark (success)
- [ ] X mark (unavailable)

#### Background Elements
- [ ] Gradient mesh/blobs (can be generated via CSS or tools like Gradient Magic)
- [ ] Animated particles (SVG or canvas-based)
- [ ] Grid pattern (subtle)
- [ ] Glowing orbs/circles (for depth)

#### User Avatars
- [ ] Default male avatar (1-2 variations)
- [ ] Default female avatar (1-2 variations)
- [ ] Generic user silhouette
- [ ] Profile placeholder

---

## Implementation Technologies

### Frontend Stack
- **React 18+** (already using)
- **Tailwind CSS** (already configured)
- **Framer Motion** (for animations - recommend installing)
- **Lucide React** (for icons - already installed)
- **React Router** (navigation)

### Recommended New Packages
```bash
npm install framer-motion lottie-react
```

### Animation Libraries
- **Framer Motion**: For component animations, transitions
- **Lottie**: For complex animated illustrations
- **CSS Animations**: For simpler effects (loading spinner, pulsing)

---

## Design Principles

1. **Consistent Spacing**: Use 8px base unit (8, 16, 24, 32, 40, 48px)
2. **Visual Hierarchy**: Use size, color, and weight to guide attention
3. **Dark Mode First**: Design for dark theme, ensure good contrast
4. **Microinteractions**: Button hover states, smooth transitions
5. **Responsive Design**: Mobile-first approach, works on all screen sizes
6. **Accessibility**: Proper contrast ratios, semantic HTML, ARIA labels

---

## File Organization (Recommended)

```
src/
├── components/
│   ├── Home/
│   │   ├── Hero.jsx
│   │   ├── Features.jsx
│   │   └── CTA.jsx
│   ├── Matching/
│   │   ├── MatchingScreen.jsx
│   │   └── MatchAnimation.jsx
│   ├── Dashboard/
│   │   ├── Sidebar.jsx
│   │   ├── StatsCards.jsx
│   │   └── InterviewsList.jsx
│   └── Common/
│       ├── Header.jsx
│       ├── Footer.jsx
│       └── LoadingSpinner.jsx
├── assets/
│   ├── illustrations/
│   │   ├── hero-collaboration.png
│   │   ├── matching-animation.svg
│   │   ├── waiting-state.png
│   │   └── handshake.png
│   ├── backgrounds/
│   │   ├── gradient-mesh.svg
│   │   └── particles.svg
│   └── icons/
│       └── (lucide icons via component)
└── pages/
    ├── Home.jsx
    ├── Dashboard.jsx
    ├── MatchRoom.jsx
    └── etc.
```

---

## Next Steps

1. **Get Illustrations**: Use the Gemini/GPT prompt above to generate SVG or PNG illustrations
2. **Set Up Animations**: Install Framer Motion
3. **Create Reusable Components**: Build card, button, avatar components
4. **Implement Pages**: Start with Home, then Dashboard, then Interview pages
5. **Add Animations**: Use Framer Motion for smooth transitions
6. **Test Responsiveness**: Ensure works on mobile, tablet, desktop
