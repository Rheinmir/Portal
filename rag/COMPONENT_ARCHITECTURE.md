# Component Architecture & Usage Guide

This document defines the architecture of the frontend components, explaining the responsibility of each component and its integration into the main application.

## 1. ShortcutCard (`src/components/ShortcutCard.jsx`)

**Functionality**:
- Displays a single shortcut item with its icon, name, and tags.
- Provides interactive features: Copy URL to clipboard, Drag & Drop support, Toggle Favorite.
- Admin features (if enabled): Edit and Delete actions.
- Supports different view modes (Launchpad vs. Grid) with adaptive styling.
- Handles tag interaction (click to filter, shift+click, or expand tags popover).

**Usage in `App.jsx`**:
Rendered within a mapped list of shortcuts.
```jsx
<ShortcutCard
  item={shortcutData}
  isAdmin={isAdmin}
  handleDragStart={onDragStart}
  handleDragOver={onDragOver}
  handleDrop={onDrop}
  handleLinkClick={redirect}
  handleEdit={openEditModal}
  handleDelete={confirmDelete}
  handleToggleFavorite={toggleFav}
  labelColors={colorMap}
  viewMode="grid"
/>
```

---

## 2. LoginModal (`src/components/AdminModals.jsx` - Named Export)

**Functionality**:
- A modal dialog for administrator authentication.
- Captures username and password.
- Displays error messages for invalid credentials.
- Uses `useLanguage` context for internalization.

**Usage**:
Rendered conditionally in the main layout when the login button/state is triggered.
```jsx
<LoginModal
  isOpen={isLoginOpen}
  onClose={() => setLoginOpen(false)}
  creds={credentials}
  setCreds={setCredentials}
  onLogin={handleLoginSubmit}
  error={loginError}
/>
```

---

## 3. AddEditModal (`src/components/AdminModals.jsx` - Named Export)

**Functionality**:
- Comprehensive form for creating or updating shortcut items.
- Fields: Name, URL, Icon (Upload or URL), Parent Group (Color/Label), Child Tags (Color/Label).
- specialized UI:
  - Drag-and-drop zone for image uploads.
  - Color pickers with presets for tags.
  - Expandable/Collapsible advanced sections.

**Usage**:
```jsx
<AddEditModal
  isOpen={isEditOpen}
  onClose={closeModal}
  formData={currentShortcut}
  setFormData={updateShortcutState}
  onSubmit={saveShortcut}
  isEdit={true} // or false for new
  isAdmin={true}
/>
```

---

## 4. SettingsModal (`src/components/AdminModals.jsx` - Named Export)

**Functionality**:
- Manages global application settings.
- Currently handles Timezone (UTC offset) configuration.
- Persists changes via a save handler.

**Usage**:
```jsx
<SettingsModal
  isOpen={showSettings}
  onClose={() => setShowSettings(false)}
  config={appConfig}
  onSave={saveConfig}
/>
```

---

## Guidelines
- **Modals**: All modals use a consistent backdrop and animation style (defined in their internal wrapper divs).
- **Styling**: Uses Tailwind CSS for all styling (no external CSS files for components).
- **Icons**: Relies on `lucide-react` for UI icons.
