# Component Architecture & Usage Guide

This document reviews the refactored frontend architecture, explaining the function of each component and how it is implemented in `App.jsx`.

## 1. FilterPanel (`src/components/FilterPanel.jsx`)

**Functionality**:
- Displays the list of "Parent Groups" (upper tabs) and "Child Tags" (lower pills).
- Handles filtering logic: clicking a group filters by parent, clicking a tag filters by tag.
- Visuals: Uses the configured `labelColors` to dynamically color the buttons.

**Usage in `App.jsx`**:
Located inside the sticky header section.
```jsx
<FilterPanel 
  isOpen={showFilterPanel}                  // Toggle visibility
  activeParentFilter={activeParentFilter}   // Current selected parent
  setActiveParentFilter={setActiveParentFilter}
  activeChildFilter={activeChildFilter}     // Current selected tag
  setActiveChildFilter={setActiveChildFilter}
  uniqueParents={uniqueParents}             // Calculated list of available parents
  uniqueChildren={uniqueChildren}           // Calculated list of available tags
  labelColors={labelColors}                 // Color mapping
  modalClass={modalClass}                   // Styling for dark/light mode
  getContrastYIQ={getContrastYIQ}           // Helper for text readability
/>
```

---

## 2. ShortcutCard (`src/components/ShortcutCard.jsx`)

**Functionality**:
- The individual "App Icon" unit in the main grid.
- Features:
  - Drag & Drop support (draggable).
  - Hover actions: Copy URL, Edit (Admin), Delete (Admin).
  - Favorite toggle (Star icon).
  - Displays Icon (or generated letter avatar) and Labels (Parent/Child).

**Usage in `App.jsx`**:
Rendered inside the main `.map()` loop of the grid.
```jsx
{pagedShortcuts.map(i => (
  <ShortcutCard 
    key={i.id}
    item={i}                              // The shortcut data object
    isAdmin={isAdmin}                     // Show/Hide admin controls
    handleDragStart={handleDragStart}     // DnD Handlers...
    handleDragOver={handleDragOver}
    handleDrop={handleDrop}
    handleDragEnd={handleDragEnd}
    handleLinkClick={handleLinkClick}     // Open URL + Track Click
    handleEdit={handleEdit}               // Open Edit Modal
    handleDelete={handleDelete}           // Delete Action
    handleToggleFavorite={handleToggleFavorite}
    cardClass={cardClass}                 // Styling
    labelColors={labelColors}
    bgOverlay={(bgImage||bgVideo||bgEmbed)} // Adjust text shadow if BG exists
    draggingId={draggingId}               // Visually dim if being dragged
    darkMode={darkMode}
    getContrastYIQ={getContrastYIQ}
  />
))}
```

---

## 3. InsightsModal (`src/components/InsightsModal.jsx`)

**Functionality**:
- Displays usage statistics (Total Clicks, Top App).
- Renders charts using `recharts`: Top 10 Apps, 7-Day Activity, Hourly Activity.
- Provides styling for the modal overlay and backdrop.

**Usage in `App.jsx`**:
Conditionally rendered when `showInsightsModal` is true.
```jsx
<InsightsModal 
  isOpen={showInsightsModal}
  onClose={() => setShowInsightsModal(false)}
  data={insightsData}                     // Data fetched from /api/insights
  onExportStats={handleExportStats}       // CSV Export handler
  onExportSummary={handleExportSummary}   // Summary Export handler
  modalClass={modalClass}
/>
```

---

## 4. Admin Modals (`src/components/AdminModals.jsx`)

### LoginModal
**Functionality**: Simple username/password form for Admin access.

**Usage**:
```jsx
<LoginModal 
  isOpen={showLoginModal}
  onClose={() => setShowLoginModal(false)}
  creds={loginCreds}
  setCreds={setLoginCreds}
  onLogin={handleLogin}
  error={loginError}
  modalClass={modalClass}
  inputClass={inputClass}
/>
```

### AddEditModal
**Functionality**: Comprehensive form to Create or Update a shortcut.
- Inputs: Name, URL, Icon (Upload/Link), Group, Tags, Colors.
- Handles file upload preview.

**Usage**:
```jsx
<AddEditModal 
  isOpen={showAddModal}
  onClose={() => setShowAddModal(false)}
  formData={formData}                     // State object for form fields
  setFormData={setFormData}
  onSubmit={handleSubmit}                 // Save/Update handler
  fileInputRef={fileInputRef}             // Ref for hidden file input
  onImageUpload={handleImageUpload}
  modalClass={modalClass}
  inputClass={inputClass}
  darkMode={darkMode}
  isEdit={!!formData.id}                  // Switch betwen "Add" and "Edit" title
/>

### SettingsModal
**Functionality**: Allows modifying global configuration like Timezone.
- Inputs: UTC Offset.

**Usage**:
```jsx
<SettingsModal
  isOpen={showSettingsModal}
  onClose={() => setShowSettingsModal(false)}
  config={{ utcOffset }}
  onSave={handleSaveSettings}
  modalClass={modalClass}
  inputClass={inputClass}
/>
```

---

## 5. Clock (`src/components/Clock.jsx`)

**Functionality**:
- Displays current time based on a configurable UTC offset.
- Updates every second.

**Usage in `App.jsx`**:
- **Desktop**: Rendered to the left of the search bar.
- **Mobile**: Rendered to the left of the pagination controls.
```jsx
<Clock utcOffset={utcOffset} className="...classes..." />
```
