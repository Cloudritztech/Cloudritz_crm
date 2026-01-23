// Draft Manager for auto-saving form data
class DraftManager {
  constructor() {
    this.storageKey = 'crm_drafts';
    this.autoSaveInterval = 2000; // 2 seconds
    this.timers = new Map();
  }

  // Get all drafts
  getAllDrafts() {
    try {
      const drafts = localStorage.getItem(this.storageKey);
      return drafts ? JSON.parse(drafts) : {};
    } catch (error) {
      console.error('Error reading drafts:', error);
      return {};
    }
  }

  // Save draft
  saveDraft(draftId, data) {
    try {
      const drafts = this.getAllDrafts();
      drafts[draftId] = {
        data,
        timestamp: Date.now(),
        lastModified: new Date().toISOString()
      };
      localStorage.setItem(this.storageKey, JSON.stringify(drafts));
      return true;
    } catch (error) {
      console.error('Error saving draft:', error);
      return false;
    }
  }

  // Get specific draft
  getDraft(draftId) {
    const drafts = this.getAllDrafts();
    return drafts[draftId] || null;
  }

  // Delete draft
  deleteDraft(draftId) {
    try {
      const drafts = this.getAllDrafts();
      delete drafts[draftId];
      localStorage.setItem(this.storageKey, JSON.stringify(drafts));
      
      // Clear auto-save timer if exists
      if (this.timers.has(draftId)) {
        clearTimeout(this.timers.get(draftId));
        this.timers.delete(draftId);
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting draft:', error);
      return false;
    }
  }

  // Auto-save with debouncing
  autoSave(draftId, data) {
    // Clear existing timer
    if (this.timers.has(draftId)) {
      clearTimeout(this.timers.get(draftId));
    }

    // Set new timer
    const timer = setTimeout(() => {
      this.saveDraft(draftId, data);
      this.timers.delete(draftId);
    }, this.autoSaveInterval);

    this.timers.set(draftId, timer);
  }

  // Check if draft exists and is recent (within 24 hours)
  hasRecentDraft(draftId) {
    const draft = this.getDraft(draftId);
    if (!draft) return false;

    const twentyFourHours = 24 * 60 * 60 * 1000;
    return (Date.now() - draft.timestamp) < twentyFourHours;
  }

  // Clean old drafts (older than 7 days)
  cleanOldDrafts() {
    try {
      const drafts = this.getAllDrafts();
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      const now = Date.now();

      Object.keys(drafts).forEach(draftId => {
        if (now - drafts[draftId].timestamp > sevenDays) {
          delete drafts[draftId];
        }
      });

      localStorage.setItem(this.storageKey, JSON.stringify(drafts));
    } catch (error) {
      console.error('Error cleaning old drafts:', error);
    }
  }

  // Get draft summary for display
  getDraftSummary(draftId) {
    const draft = this.getDraft(draftId);
    if (!draft) return null;

    const data = draft.data;
    const itemCount = data.items?.filter(item => item.product && item.quantity > 0).length || 0;
    const customerName = data.customerName || 'Unknown Customer';
    
    return {
      id: draftId,
      customerName,
      itemCount,
      lastModified: draft.lastModified,
      timestamp: draft.timestamp
    };
  }

  // Clear all timers (call on component unmount)
  clearAllTimers() {
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers.clear();
  }
}

export const draftManager = new DraftManager();

// Auto-clean old drafts on initialization
draftManager.cleanOldDrafts();