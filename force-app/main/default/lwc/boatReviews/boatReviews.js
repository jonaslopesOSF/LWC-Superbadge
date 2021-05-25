import { LightningElement, api, track } from "lwc";
import { NavigationMixin } from "lightning/navigation";
import getAllReviews from "@salesforce/apex/BoatDataService.getAllReviews";

export default class BoatReviews extends NavigationMixin(LightningElement) {
  // Private
  @track boatReviews;
  @track error;
  @track isLoading;
  @track boatId;
  readOnly = true;
  
  // Getter and Setter to allow for logic to run on recordId change
  get recordId() {
    return this.boatId;
  }

  @api set recordId(value) {
    //sets boatId attribute
    //sets boatId assignment
    this.setAttribute("boatId", value);
    this.boatId = value;

    this.getReviews();
  }
  
  // Getter to determine if there are reviews to display
  get reviewsToShow() { 
    return this.boatReviews?.length ? true : false;
  }

  // Public method to force a refresh of the reviews invoking getReviews
  @api refresh() { 
    this.getReviews();
  }
  
  // Imperative Apex call to get reviews for given boat
  // returns immediately if boatId is empty or null
  // sets isLoading to true during the process and false when it’s completed
  // Gets all the boatReviews from the result, checking for errors.
  getReviews() { 
    if (!this.boatId) {
      return;
    }

    this.isLoading = true;

    getAllReviews({ boatId: this.recordId })
      .then((result) => {
        this.boatReviews = result;
        this.error = undefined;
      })
      .catch((error) => {
        this.boatReviews = undefined;
        this.error = error.body.message;;
      })
      .finally(() => {
        this.isLoading = false;
      });
  }
  
  // Helper method to use NavigationMixin to navigate to a given record on click
  navigateToRecord(event) { 
    this[NavigationMixin.Navigate]({
      type: "standard__recordPage",
      attributes: {
        recordId: event.target.dataset.recordId,
        actionName: "view"
      }
    });
  }
}
