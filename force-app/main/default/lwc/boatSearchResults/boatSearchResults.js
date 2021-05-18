import { LightningElement, wire, api, track } from "lwc";
import getBoats from "@salesforce/apex/BoatDataService.getBoats";
import updateBoatList from "@salesforce/apex/BoatDataService.updateBoatList";
import { getRecordNotifyChange } from "lightning/uiRecordApi";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import { refreshApex } from "@salesforce/apex";
import BOATMC from "@salesforce/messageChannel/BoatMessageChannel__c";
import { MessageContext, publish } from "lightning/messageService";

const SUCCESS_TITLE = "Success";
const MESSAGE_SHIP_IT = "Ship it!";
const SUCCESS_VARIANT = "success";
const ERROR_TITLE = "Error";
const ERROR_VARIANT = "error";
const COLS = [
  { label: "Name", fieldName: "Name", editable: true },
  { label: "Length", fieldName: "Length__c", editable: true },
  {
    label: "Price",
    fieldName: "Price__c",
    editable: true,
    type: "currency",
    typeAttributes: { currencyCode: "USD" }
  },
  { label: "Description ", fieldName: "Description__c", editable: true }
];

export default class BoatSearchResults extends LightningElement {
  @api boatTypeId = "";
  selectedBoatId;
  isLoading = false;
  draftValues = [];
  columns = COLS;
  @track boats;

  // wired message context
  @wire(MessageContext)
  messageContext;

  // wired getBoats method
  @wire(getBoats, { boatTypeId: "$boatTypeId" })
  wiredBoats(result) {
    if (result) {
      this.boats = result;
    } 
  }

  // public function that updates the existing boatTypeId property
  // uses notifyLoading
  searchBoats(boatTypeId) {
    this.boatTypeId = boatTypeId;
    this.notifyLoading(true);
  }

  // this function must update selectedBoatId and call sendMessageService
  updateSelectedTile(event) {
    this.selectedBoatId = event.detail.boatId;
    this.sendMessageService(this.selectedBoatId);
  }

  // Publishes the selected boat Id on the BoatMC.
  sendMessageService(boatId) {
    // explicitly pass boatId to the parameter recordId
    const message = {
      recordId: boatId
    };
    publish(this.messageContext, BOATMC, message);
  }

  // The handleSave method must save the changes in the Boat Editor
  // passing the updated fields from drafaultValues to the
  // Apex method updateBoatList(Object data).
  // Show a toast message with the title
  // clear lightning-datatable draft values
  async handleSave(event) {
    // notify loading
    this.notifyLoading(true);
    const updatedFields = event.detail.draftValues;
    console.log('updateFields', updatedFields);
    const notifyChangeIds = updatedFields.map((row) => {
      return { recordId: row.Id };
    });
    console.log('notifyChangeIds', notifyChangeIds);

    // Update the records via Apex
    await updateBoatList({ data: updatedFields })
      .then((result) => {
        console.log(JSON.stringify("Apex update result: " + result));
        this.showToastMessage(SUCCESS_TITLE, MESSAGE_SHIP_IT, SUCCESS_VARIANT);
        // Refresh LDS cache and wires
        getRecordNotifyChange(notifyChangeIds);
        // Display fresh data in the datatable
        this.refresh();
      })
      .catch((error) => {
        this.showToastMessage(ERROR_TITLE, error.body.message, ERROR_VARIANT);
      })
      .finally(() => {
        this.notifyLoading(false);
      });
  }

  // Check the current value of isLoading before dispatching the doneloading or loading custom event
  notifyLoading(isLoading) {
    if (isLoading) {
      this.dispatchingEvent("loading", isLoading);
    } else {
      this.dispatchingEvent("doneloading", isLoading);
    }
  }

  dispatchingEvent(eventName, isLoading) {
    const loadingEvent = new CustomEvent(eventName, {
      detail: { isLoading }
    });

    this.dispatchEvent(loadingEvent);
  }

  showToastMessage(title, message, variant) {
    const toastEvent = new ShowToastEvent({
      title,
      message,
      variant
    });

    this.dispatchEvent(toastEvent);
  }

  // this public function must refresh the boats asynchronously
  // uses notifyLoading
  refresh() {
    this.isLoading = true;

    refreshApex(this.boats).then(() => {
      // Clear all draft values in the datatable
      this.isLoading = false;
      this.draftValues = [];
    });
  }

  get boat () {
    return this.boats.find(boat => {
      return boat.Id = selectedBoatId;
    });
  }
}
