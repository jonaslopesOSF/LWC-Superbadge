import { LightningElement, api, track, wire } from 'lwc';
import { NavigationMixin } from "lightning/navigation";
import getSimilarBoats from "@salesforce/apex/BoatDataService.getSimilarBoats";

export default class SimilarBoats extends NavigationMixin(LightningElement) {
  // Private
  @track boatId;
  currentBoat;
  relatedBoats;
  error;
  
  // public
  @api similarBy;

  @api get recordId() {
    return this.boatId;
  }
  
  set recordId(value) {
    this.setAttribute("boatId", value);
    this.boatId = value;
  }
  
  // Wire custom Apex call, using the import named getSimilarBoats
  // Populates the relatedBoats list
  @wire(getSimilarBoats, { boatId: "$boatId", similarBy: "$similarBy" })
  similarBoats({ error, data }) {
    if (data) {
      this.relatedBoats = data;
      this.error = undefined;
    } else if (error) {
      this.error = error;
      this.relatedBoats = undefined;
    }
  }
  
  get getTitle() {
    return 'Similar boats by ' + this.similarBy;
  }

  get noBoats() {
    return !(this.relatedBoats && this.relatedBoats.length > 0);
  }
  
  // Navigate to record page
  openBoatDetailPage(event) { 
    this[NavigationMixin.Navigate]({
      type: "standard__recordPage",
      attributes: {
        recordId: event.detail.boatId,
        actionName: "view"
      }
    });
  }
}
