sap.ui.define([], function () {
    "use strict";
    return {
        formatDate: function (sDateValue) {
            if (!sDateValue) {
                return "";
            }
            var oDateFormat = sap.ui.core.format.DateFormat.getDateInstance({
                pattern: "dd.MM.yyyy" // Or any other desired pattern like "MMM d, yyyy", "long", "medium", etc.
            });
            return oDateFormat.format(new Date(sDateValue));
        },

        formatDateTime: function (sDateValue) {
            if (!sDateValue) {
                return "";
            }
            var oDateFormat = sap.ui.core.format.DateFormat.getDateInstance({
                pattern: "dd.MM.yyyy hh:mm" // Or any other desired pattern like "MMM d, yyyy", "long", "medium", etc.
            });
            return oDateFormat.format(new Date(sDateValue));
        },

        formatStatus: function (sStatus) {
            const oResourceBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
            switch (sStatus) {
                case "R": return oResourceBundle.getText("statusR");
                case "N": return oResourceBundle.getText("statusN");
                case "A": return oResourceBundle.getText("statusA");
                case "X": return oResourceBundle.getText("statusX");
                default: return sStatus;
            }
        },

        formatNumber: function (value) {
            if (value === null || value === undefined) {
                return "";
            }

            // Get a float instance with grouping enabled
            var oFormat = sap.ui.core.format.NumberFormat.getFloatInstance({
                maxFractionDigits: 2,
                minFractionDigits: 2,
                groupingEnabled: true,
                decimalSeparator: ",",
                groupingSeparator: "."
            });
            var nFloat = parseFloat(value);
            var oResult = oFormat.format(nFloat);

            return oResult;
        }

    };
});