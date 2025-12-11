sap.ui.define([], function() {
    "use strict";
    return {
        dateIsFuture: function(sDate) {
            let oDate = new Date(sDate);
            let oNow = new Date();
            return oDate > oNow;
        },

        startDateIsLater: function(sStart, sFinish) {
            let oStartDate = new Date(sStart);
            let oFinishDate = new Date(sFinish);
            return oStartDate > oFinishDate;

        }
    }
});