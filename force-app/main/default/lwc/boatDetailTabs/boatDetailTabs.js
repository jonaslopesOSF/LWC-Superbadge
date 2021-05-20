import { LightningElement, wire } from "lwc";
import { NavigationMixin } from "lightning/navigation"; 
import { getRecord, getFieldValue } from "lightning/uiRecordApi";

// Custom Labels Imports
import labelDetails from "@salesorce/label/c.Details";
import labelReviews from "@salesorce/label/c.Reviews";
import labelAddReview from "@salesorce/label/c.Add_Review";
import labelFullDetails from "@salesorce/label/c.Full_Details";
import labelPleaseSelectABoat from "@salesorce/label/c.Please_select_a_boat";

// Boat__c Schema Imports
// import BOAT_ID_FIELD for the Boat Id
// import BOAT_NAME_FIELD for the boat Name
import BOAT_ID_FIELD from "@salesforce/schema/Boat__c.Id";
import BOAT_NAME_FIELD from "@salesforce/schema/Boat__c.Name";
const BOAT_FIELDS = [BOAT_ID_FIELD, BOAT_NAME_FIELD];

import BOATMC from "@salesforce/messageChannel/BoatMessageChannel__c";
import {
  APPLICATION_SCOPE,
  MessageContext,
  subscribe,
  unsubscribe
} from "lightning/messageService";

export default class BoatDetailTabs extends NavigationMixin(LightningElement) {
  boatId;
  subscription = null;
  label = {
    labelDetails,
    labelReviews,
    labelAddReview,
    labelFullDetails,
    labelPleaseSelectABoat,
  };


  @wire(MessageContext)
  messageContext;
  
  @wire(getRecord, { recordId: '$boatId', BOAT_FIELDS })
  wiredRecord;
  
  // Decide when to show or hide the icon
  // returns 'utility:anchor' or null
  get detailsTabIconName() { 
    this.wiredRecord.data ? "utility:anchor" : null;
  }
  
  // Utilize getFieldValue to extract the boat name from the record wire
  get boatName() {
    return getFieldValue(this.wiredRecord.data, BOAT_NAME_FIELD);
  }
  
  // Private
  subscription = null;
  
  // Calls subscribeMC()
  connectedCallback() { 
    if(this.subscription || this.boatId) {
      return;
    }

    this.subscribeMC();
  }
  
  // Subscribe to the message channel
  subscribeMC() {
    // local boatId must receive the recordId from the message
    if(!this.subscription) {
      this.subscription = subscribe(
        this.messageContext,
        BOATMC,
        (message) => this.boatId = message.recordId,
        { scope: APPLICATION_SCOPE }
      );
    }
  }

  disconnectedCallback() {
    unsubscribe(this.subscription);
    this.subscription = null;
  }
  
  // Navigates to record page
  navigateToRecordViewPage() { 
    this[NavigationMixin.Navigate]({
      type: 'standard__objectPage',
      attributes: {
        recordId: this.boatId,
        objectApiName: 'Boat__c',
        actionName: 'view'
      }
    });
  }
  
  // Navigates back to the review list, and refreshes reviews component
  handleReviewCreated() { }
}
