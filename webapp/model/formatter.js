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
            }
        };
    });