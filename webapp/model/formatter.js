    sap.ui.define([], function() {
        "use strict";
        return {
            formatDate: function(sDateValue) {
                if (!sDateValue) {
                    return "";
                }
                var oDateFormat = sap.ui.core.format.DateFormat.getDateInstance({
                    pattern: "dd.MM.yyyy" // Or any other desired pattern like "MMM d, yyyy", "long", "medium", etc.
                });
                return oDateFormat.format(new Date(sDateValue));
            },

            formatStatus: function(sStatus) {
                const oResourceBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
                switch (sStatus) {
                    case "N": return oResourceBundle.getText("statusN");
                    case "A": return oResourceBundle.getText("statusA");
                    default: return sStatus;
                }
            },

        };
    });