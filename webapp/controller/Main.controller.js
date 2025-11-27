sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "../model/models"
],
    function (Controller, models) {
        "use strict";

        return Controller.extend("zpmchecklist.controller.Main", {
            onInit: function () {
                const oViewParam = {
                    createMode: false,
                    displayMode: true,
                    changeMode: false,
                    aufnr: "",
                    chkno: ""
                }
                const oDisplayModel = models.createJSONModel(oViewParam);
                this.getView().setModel(oDisplayModel, "displayModel");
            },

            onCreate: function () {
                // var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                const sParam = this._getRouteProperty("aufnr");
                var oRouter = this.getOwnerComponent().getRouter();
                oRouter.navTo("create", {
                    aufnr: sParam
                });
            },

            onDisplay: function () {
                const sParam = this._getRouteProperty("aufnr");
                var oRouter = this.getOwnerComponent().getRouter();
                oRouter.navTo("detail", {
                    aufnr: sParam
                });
            },

            onChange: function () {
                const sParam = this._getRouteProperty("aufnr");
                var oRouter = this.getOwnerComponent().getRouter();
                oRouter.navTo("detail", {
                    aufnr: sParam
                });
            },

            onSelectionChange: function (oEvent) {
                const oSelectedItem = oEvent.getParameter("listItem");
                if (oSelectedItem) {
                    const oModel = this.getView().getModel("displayModel");
                    let oBindingContext = oSelectedItem.getBindingContext("pmOrderService");
                    let oOrder = oBindingContext.getObject();
                    oModel.setProperty("/aufnr", oOrder.aufnr);
                    oModel.setProperty("/chkno", oOrder.chkno);
                    if (!oOrder.chkno) {
                        oModel.setProperty("/createMode", true);
                        oModel.setProperty("/changeMode", false);
                        oModel.setProperty("/displayMode", false);
                    } else {
                        oModel.setProperty("/createMode", false);
                        if (oOrder.stat = 'I0002') {
                            oModel.setProperty("/changeMode", true);
                            oModel.setProperty("/displayMode", false);
                        } else {
                            oModel.setProperty("/changeMode", false);
                            oModel.setProperty("/displayMode", true);
                        }
                    }
                }
            },

            _getRouteProperty: function (sProp) {
                const oModel = this.getView().getModel("displayModel");
                const sPath = "/" + sProp;
                const sParam = oModel.getProperty(sPath);
                return sParam;
            }
        });
    });
