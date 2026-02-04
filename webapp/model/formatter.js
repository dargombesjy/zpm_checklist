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
                pattern: "dd.MM.yyyy HH:mm"
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

        formatSeverity(sSeverity) {
            let oSeverity = {
                severity: "success",
                title: "Success",
                icon: sap.m.MessageBox.Icon.SUCCESS
            }
            switch (sSeverity) {
                case "error": return { severity: "error", title: "Error", icon: sap.m.MessageBox.Icon.ERROR };
                case "warning": return { severity: "warning", title: "Warning", icon: sap.m.MessageBox.Icon.WARNING };
                case "success": return { severity: "success", title: "Success", icon: sap.m.MessageBox.Icon.SUCCESS };
                case "information": return { severity: "information", title: "Information", icon: sap.m.MessageBox.Icon.INFORMATION };
                default: return oSeverity;
            }
        },

        formatNumber(value) {
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