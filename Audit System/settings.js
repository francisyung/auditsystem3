// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-analytics.js";
// Import Firebase Authentication and Firestore modules
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
import { getFirestore, collection, getDocs, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js"; // Added getDoc

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDsHxFMMHy2qYsLaYjAUTqMeQKwC4zNDbQ",
  authDomain: "audit-system-76e00.firebaseapp.com",
  projectId: "audit-system-76e00",
  storageBucket: "audit-system-76e00.firebasestorage.app",
  messagingSenderId: "874863390026",
  appId: "1:874863390026:web:1d4783557663fb0468a5b3",
  measurementId: "G-EXNH41C2E0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
// Get Firebase Authentication and Firestore instances
const auth = getAuth(app);
const db = getFirestore(app);

// Global variable to hold the current authenticated user
let currentUser = null;

// --- Firebase Authentication State Change Listener ---
onAuthStateChanged(auth, (user) => {
  currentUser = user; // Update the global currentUser variable
  if (user) {
    console.log("User is signed in:", user.email, user.uid);
    // When a user is signed in, we can now load their profile data from Firestore
    // This will replace the initial fillForm() call that relies on localStorage
    loadAndFillUserProfile();
  } else {
    console.log("User is signed out.");
    // If the user signs out, we might want to clear the form or redirect
    // For now, let's just use default state if no user is logged in
    fillForm(defaultState());
  }
});

// --- Original `defaultState()` function (used as fallback for missing Firestore data) ---
function defaultState() {
  return {
    profilePhotoUrl: '',
    profilePhotoDataUrl: '',
    displayName: 'Guest User', // Changed default to reflect not logged in
    preferredName: '',
    workEmail: '',
    workPhone: '',
    jobTitle: '',
    department: '',
    employeeId: '',
    officeLocation: '',
    pronouns: '',
    bio: '',
    timezone: 'Africa/Nairobi',
    locale: 'en-KE',
    dateFormat: 'DD/MM/YYYY',
    weekStartsOn: 'monday',
    notifyCritical: true,
    notifyWeekly: true,
    notifyExport: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '07:00',
    sessionTimeout: '60',
    notifyNewDevice: true,
    darkMode: false,
    profileUpdatedAt: null
  };
}

// --- NEW: Function to fetch user data from Firestore ---
async function fetchUserProfileFromFirestore(userId) {
  if (!userId) {
    console.error("No user ID provided to fetchUserProfileFromFirestore.");
    return null;
  }
  const userDocRef = doc(db, "users", userId);
  const userDocSnap = await getDoc(userDocRef);

  if (userDocSnap.exists()) {
    console.log("User data from Firestore:", userDocSnap.data());
    const firestoreData = userDocSnap.data();

    // Map Firestore fields to your state structure.
    // Note: 'fullName' from Firestore maps to 'displayName' in your state.
    // Add other mappings as needed.
    return {
      ...defaultState(), // Start with defaults to ensure all fields are present
      displayName: firestoreData.fullName || defaultState().displayName,
      workEmail: firestoreData.email || defaultState().workEmail,
      department: firestoreData.departmentId || defaultState().department, // Assuming departmentId from signup can be department
      company: firestoreData.company || defaultState().company, // Example: added company from signup
      // Add other fields you store in Firestore to map them to your state
      // For fields missing in Firestore, defaultState() provides a fallback
      preferredName: firestoreData.preferredName || defaultState().preferredName,
      workPhone: firestoreData.workPhone || defaultState().workPhone,
      jobTitle: firestoreData.jobTitle || defaultState().jobTitle,
      employeeId: firestoreData.employeeId || defaultState().employeeId,
      officeLocation: firestoreData.officeLocation || defaultState().officeLocation,
      pronouns: firestoreData.pronouns || defaultState().pronouns,
      bio: firestoreData.bio || defaultState().bio,
      timezone: firestoreData.timezone || defaultState().timezone,
      locale: firestoreData.locale || defaultState().locale,
      dateFormat: firestoreData.dateFormat || defaultState().dateFormat,
      weekStartsOn: firestoreData.weekStartsOn || defaultState().weekStartsOn,
      notifyCritical: firestoreData.notifyCritical !== undefined ? firestoreData.notifyCritical : defaultState().notifyCritical,
      notifyWeekly: firestoreData.notifyWeekly !== undefined ? firestoreData.notifyWeekly : defaultState().notifyWeekly,
      notifyExport: firestoreData.notifyExport !== undefined ? firestoreData.notifyExport : defaultState().notifyExport,
      quietHoursStart: firestoreData.quietHoursStart || defaultState().quietHoursStart,
      quietHoursEnd: firestoreData.quietHoursEnd || defaultState().quietHoursEnd,
      sessionTimeout: firestoreData.sessionTimeout || defaultState().sessionTimeout,
      notifyNewDevice: firestoreData.notifyNewDevice !== undefined ? firestoreData.notifyNewDevice : defaultState().notifyNewDevice,
      darkMode: firestoreData.darkMode !== undefined ? firestoreData.darkMode : defaultState().darkMode,
      profileUpdatedAt: firestoreData.profileUpdatedAt ? new Date(firestoreData.profileUpdatedAt.toDate()) : defaultState().profileUpdatedAt // Handling Firestore Timestamp
    };
  } else {
    console.log("No user profile found in Firestore for UID:", userId);
    return null;
  }
}

// --- Modified `loadState()` to prioritize Firestore, then localStorage, then default ---
async function loadState() {
  if (currentUser) {
    const firestoreData = await fetchUserProfileFromFirestore(currentUser.uid);
    if (firestoreData) {
      return firestoreData;
    }
  }

  // Fallback to localStorage if no Firestore data or no logged-in user
  try {
    var raw = localStorage.getItem('sentinelSettingsV1');
    if (raw) {
      var parsed = JSON.parse(raw);
      // Merge with defaultState to ensure all fields are present
      return Object.assign(defaultState(), parsed);
    }
  } catch (e) {
    console.error("Error loading from localStorage:", e);
  }

  // Final fallback to default state
  return defaultState();
}

// --- Modified `saveState()` to save to Firestore and then localStorage ---
async function saveState(data) {
  if (currentUser) {
    const userDocRef = doc(db, "users", currentUser.uid);
    try {
      // Prepare data for Firestore, potentially converting Date objects
      const dataToSave = { ...data };
      if (dataToSave.profileUpdatedAt) {
        dataToSave.profileUpdatedAt = new Date(dataToSave.profileUpdatedAt); // Ensure it's a Date object for Firestore
      }
      await setDoc(userDocRef, dataToSave, { merge: true }); // Use merge: true to avoid overwriting entire document
      console.log("User profile saved to Firestore for UID:", currentUser.uid);
    } catch (error) {
      console.error("Error saving profile to Firestore:", error);
      // Optionally, show a toast or error message to the user
    }
  }

  // Always save to localStorage as a backup or for offline capabilities
  localStorage.setItem('sentinelSettingsV1', JSON.stringify(data));
}


// --- Rest of your original functions (minor adjustments for fillForm) ---
var STORAGE_KEY = 'sentinelSettingsV1';
var DEFAULT_AVATAR = 'https://lh3.googleusercontent.com/aida-public/AB6AXuCNv57lVv_-U1Yyt_mPzDmmRrZXVBgASckbrKvRh9ytlhZfTNRvxWEi4FogCkp4p7OuyxtlwTjcUqd6BF29YCH5MjsSdwJ7ksu5yYdVwueuTzzXLq2xrNaMlPtRj3RoHyeq6kltNIR8PeogccRtuAPiXUyhV9LB0jCGAcgOcWB_kldDgLLn53EsGrGbdq3LEjY';

// Global state variable, will be initialized after auth state is known
let state = defaultState(); // Initialize with default, will be updated by loadAndFillUserProfile

var root = document.documentElement;

function $(id) { return document.getElementById(id); }

function showToast(msg) {
  var el = $('settingsToast');
  if (!el) return;
  el.textContent = msg;
  el.classList.remove('hidden');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(function () { el.classList.add('hidden'); }, 4200);
}

function applyAvatar() {
  var img = $('profileAvatarPreview');
  if (!img) return;
  if (state.profilePhotoDataUrl) {
    img.src = state.profilePhotoDataUrl;
  } else if (state.profilePhotoUrl && /^https?:\/\//i.test(state.profilePhotoUrl)) {
    img.src = state.profilePhotoUrl;
  } else {
    img.src = DEFAULT_AVATAR;
  }
}

function updateSummary() {
  var nameEl = $('profileSummaryName');
  var lineEl = $('profileSummaryLine');
  if (nameEl) nameEl.textContent = state.displayName || '—';
  if (lineEl) {
    var title = state.jobTitle || '—';
    lineEl.textContent = (state.workEmail || '') + ' · ' + title;
  }
  var saved = $('profileLastSaved');
  if (saved) {
    saved.textContent = state.profileUpdatedAt
      ? 'Last saved: ' + new Date(state.profileUpdatedAt).toLocaleString()
      : 'Not saved yet this session.';
  }
}

// fillForm now takes a state object as an argument
function fillForm(currentState) {
  state = currentState; // Update the global state variable
  $('profilePhotoUrl').value = state.profilePhotoUrl || '';
  $('displayName').value = state.displayName;
  $('preferredName').value = state.preferredName || '';
  $('workEmail').value = state.workEmail;
  $('workPhone').value = state.workPhone || '';
  $('jobTitle').value = state.jobTitle || '';
  $('department').value = state.department || '';
  $('employeeId').value = state.employeeId || '';
  $('officeLocation').value = state.officeLocation || '';
  $('pronouns').value = state.pronouns || '';
  $('bio').value = state.bio || '';
  $('timezone').value = state.timezone;
  $('locale').value = state.locale;
  $('dateFormat').value = state.dateFormat;
  $('weekStartsOn').value = state.weekStartsOn;
  $('quietHoursStart').value = state.quietHoursStart || '22:00';
  $('quietHoursEnd').value = state.quietHoursEnd || '07:00';
  $('sessionTimeout').value = state.sessionTimeout || '60';
  $('notifyNewDevice').checked = !!state.notifyNewDevice;

  var toggles = document.querySelectorAll('#notifications input[type="checkbox"]');
  if (toggles[0]) toggles[0].checked = !!state.notifyCritical;
  if (toggles[1]) toggles[1].checked = !!state.notifyWeekly;
  if (toggles[2]) toggles[2].checked = !!state.notifyExport;

  var dm = $('darkModeToggle');
  if (dm) dm.checked = !!state.darkMode;
  if (window.SentinelTheme) SentinelTheme.apply();
  else if (dm) root.classList.toggle('dark', dm.checked);
  applyAvatar();
  updateSummary();
}

function readNotificationsFromDom() {
  var toggles = document.querySelectorAll('#notifications ul > li input[type="checkbox"]');
  state.notifyCritical = toggles[0] ? toggles[0].checked : state.notifyCritical;
  state.notifyWeekly = toggles[1] ? toggles[1].checked : state.notifyWeekly;
  state.notifyExport = toggles[2] ? toggles[2].checked : state.notifyExport;
}

$('profileForm').addEventListener('submit', async function (e) {
  e.preventDefault();
  state.profilePhotoUrl = $('profilePhotoUrl').value.trim();
  state.displayName = $('displayName').value.trim();
  state.preferredName = $('preferredName').value.trim();
  state.workEmail = $('workEmail').value.trim();
  state.workPhone = $('workPhone').value.trim();
  state.jobTitle = $('jobTitle').value.trim();
  state.department = $('department').value.trim();
  state.employeeId = $('employeeId').value.trim();
  state.officeLocation = $('officeLocation').value.trim();
  state.pronouns = $('pronouns').value;
  state.bio = $('bio').value.trim();
  state.profileUpdatedAt = Date.now();
  await saveState(state); // Make sure to await saveState
  applyAvatar();
  updateSummary();
  showToast('Profile saved. Your details are stored in this browser and backed up to Firestore.');
});

$('profileDiscard').addEventListener('click', async function () {
  state = await loadState(); // Await loadState
  fillForm(state);
  showToast('Restored last saved settings.');
});

$('profilePhotoFile').addEventListener('change', function (e) {
  var file = e.target.files && e.target.files[0];
  if (!file || !file.type.match(/^image\//)) return;
  var reader = new FileReader();
  reader.onload = function () {
    state.profilePhotoDataUrl = reader.result;
    state.profilePhotoUrl = '';
    $('profilePhotoUrl').value = '';
    applyAvatar();
  };
  reader.readAsDataURL(file);
});

$('profilePhotoUrl').addEventListener('change', function () {
  state.profilePhotoDataUrl = '';
  state.profilePhotoUrl = $('profilePhotoUrl').value.trim();
  applyAvatar();
});

$('saveRegional').addEventListener('click', async function () {
  // Load the latest state before modifying specific regional settings
  const latestState = await loadState();
  state = Object.assign(latestState, {
    timezone: $('timezone').value,
    locale: $('locale').value,
    dateFormat: $('dateFormat').value,
    weekStartsOn: $('weekStartsOn').value
  });
  await saveState(state); // Await saveState
  showToast('Regional settings saved.');
});

$('saveAppearanceSecurity').addEventListener('click', async function () {
  // Load the latest state before modifying specific appearance/security settings
  const latestState = await loadState();
  state = latestState; // Update global state
  readNotificationsFromDom(); // This modifies the global `state`
  state.quietHoursStart = $('quietHoursStart').value;
  state.quietHoursEnd = $('quietHoursEnd').value;
  state.sessionTimeout = $('sessionTimeout').value;
  state.notifyNewDevice = $('notifyNewDevice').checked;
  state.darkMode = $('darkModeToggle').checked;
  await saveState(state); // Await saveState
  if (window.SentinelTheme) SentinelTheme.apply();
  else root.classList.toggle('dark', state.darkMode);
  showToast('Security and appearance saved.');
});

var dm = $('darkModeToggle');
if (dm) {
  dm.addEventListener('change', function () {
    if (window.SentinelTheme) SentinelTheme.setDark(dm.checked);
    else root.classList.toggle('dark', dm.checked);
  });
}


async function loadAndFillUserProfile() {
  const userSettings = await loadState();
  fillForm(userSettings);
}
