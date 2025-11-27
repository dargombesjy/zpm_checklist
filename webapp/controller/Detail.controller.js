sap.ui.define([
    "zpmchecklist/controller/BaseController",
    "zpmchecklist/model/models"
], function (BaseController, models) {
    "use strict";

    return BaseController.extend("zpmchecklist.controller.Detail", {
        onInit: function () {
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("detail").attachMatched(this._onRouteMatched, this);
        },

        _buildContent: async function () {
            // const oComponent = this.getOwnerComponent();
            const oView = this.getView();
            const oModel = oView.getModel();
            const oViewModel = oView.getModel("oViewModel");
            const sAufnr = oViewModel.getProperty("/aufnr");

            try {
                const oDataHeader = await new Promise(function (resolve, reject) {
                    oModel.read("/ViewHeaderSet(ingpr='',aufnr='" + sAufnr + "')", {
                        urlParameters: {
                            "$expand": "toColumn"
                        },
                        success: function (oData) {
                            resolve(oData);
                        },
                        error: function (oError) {
                            reject(oError);
                        }
                    });
                });
                this._oChecklistHeader = oDataHeader;

            } catch (error) {
                console.error(error);
            }

            try {
                const oDataChecklist = await new Promise(function (resolve, reject) {
                    oModel.read("/ZC_PMChecklistHeader", {
                        filters: [
                            new sap.ui.model.Filter("IsActiveEntity", sap.ui.model.FilterOperator.EQ, "true")
                        ],
                        urlParameters: {
                            "$expand": "to_Item,to_Partner,to_Attachment"
                        },
                        success: function (oData) {
                            resolve(oData.results);
                        },
                        error: function (oError) {
                            reject(oError);
                        }
                    });
                });
                this._oChecklistData = oDataChecklist[0];
            } catch (error) {
                console.error(error);
            }

            try {
                const oDataItems = await new Promise(function (resolve, reject) {
                    oModel.read("/ViewItemSet", {
                        filters: [
                            new sap.ui.model.Filter("aufnr", sap.ui.model.FilterOperator.EQ, sAufnr)
                        ],
                        success: function (oData) {
                            resolve(oData.results);
                        },
                        error: function (oError) {
                            reject(oError);
                        }
                    });
                });


                oDataItems.sort(function (a, b) {
                    return a.aplzl - b.aplzl;
                });

                this._buildChangeModel(oDataItems);
                this._setupPage(oDataItems);
            } catch (error) {
                console.error(error);
            }
        },

        _setupPage: function (oData) {
            const oPage = this.getView().byId("detailPage");

            const oChecklistContainer = new sap.m.VBox("checklistContainer", {
                // justifyContent: sap.m.FlexJustifyContent.Center,
                width: "100%"
            });

            const oHeaderContainer = new sap.m.HBox("headerContainer", {
                justifyContent: sap.m.FlexJustifyContent.Center,
                width: "100%"
            });

            const oTableContainer = new sap.m.HBox("tableContainer", {
                justifyContent: sap.m.FlexJustifyContent.Center,
                width: "100%"
            });

            const oFooterContainer = new sap.m.HBox("footerContainer", {
                justifyContent: sap.m.FlexJustifyContent.Center,
                width: "100%"
            });

            const oImageContainer = new sap.m.HBox("imageContainer", {
                justifyContent: sap.m.FlexJustifyContent.Center,
                width: "100%"
            });

            oChecklistContainer.addItem(oHeaderContainer);
            oChecklistContainer.addItem(oTableContainer);
            oChecklistContainer.addItem(oFooterContainer);
            oChecklistContainer.addItem(oImageContainer);

            this._buildHeader(oData, oHeaderContainer);
            this._buildTable(oData, oTableContainer);
            this._buildFooter(oData, oFooterContainer);
            this._buildImageBox(oData, oImageContainer);

            oPage.addContent(oChecklistContainer);
        },

        onSave: function () {
            this.byId("saveButton").setVisible(false);
            this.byId("cancelButton").setVisible(false);
            this.byId("editButton").setVisible(true);
            this._createChecklist();
        },

        onCancel: function () {
            this.byId("cancelButton").setVisible(false);
            this.byId("saveButton").setVisible(false);
            this.byId("editButton").setVisible(true);
        },

        _changeChecklist: function () {
            // Implement checklist creation logic here
            const oModel = this.getOwnerComponent().getModel();
            const oNewChecklist = {
                // chkno: "100000000001",
                aufnr: "0060000013",
                chkty: "A",
                cstat: "N",
                cvhid: this._oChecklistHeader.cvhid,
                IsActiveEntity: true
            };
            oNewChecklist.to_Item = [];

            let itemNumber = 0;
            let itemLength = 4;
            for (let rowModel of this._aRowModels) {
                const sModelName = rowModel.cgiid + "_" + rowModel.item_pos;
                const oRowModel = this.getView().getModel(sModelName);
                const oRowData = oRowModel.getData();

                itemNumber += 1;
                for (let val in oRowData.values) {
                    const oNewItem = {
                        itemno: itemNumber.toString().padStart(itemLength, '0'),
                        cgiid: oRowData.cgiid,
                        key_type: "K",
                        val_type: oRowData.val_type,
                        IsActiveEntity: true
                    };
                    oNewItem.keyname = val;
                    oNewItem.atwrt = oRowData.values[val];
                    // oNewItem.atawe = oRowData.values[val];
                    // oNewItem.atflv = oRowData.values[val];
                    // oNewItem.remark = oRowData.values["remark"];
                    oNewChecklist.to_Item.push(oNewItem);
                }
            }

            oModel.create("/ZC_PMChecklistHeader", oNewChecklist, {
                success: function (oData) {
                    sap.m.MessageToast.show("Checklist created successfully!");
                },
                error: function (oError) {
                    sap.m.MessageBox.error("Error creating checklist.");
                }
            });
        },

        _onRouteMatched: function (oEvent) {
            const oArgs = oEvent.getParameter("arguments");
            const oViewData = {
                list: [{ key: "Y", text: "Yes" }, { key: "N", text: "No" }],
                aufnr: oArgs.aufnr,
                isNew: false
            };
            const oJsonModel = models.createJSONModelOne(oViewData);
            this.getView().setModel(oJsonModel, "oViewModel");

            this._buildContent();
        },

        onBack: function (oEvent) {
            const oRouter = this.getOwnerComponent().getRouter();
            this.onExit();
            const oCreatePage = this.getView().byId("detailPage");
            if (oCreatePage) {
                oCreatePage.destroyContent();
            }
            oRouter.navTo("main");
        },

        _buildChangeModel: async function (oDataItems) {
            let oChecklistModel = models.createJSONModel(this._oChecklistData);
            this.getView().setModel(oChecklistModel, "oChecklistModel");

            const aItemCopy = oDataItems.slice();
            let iItemPos = 0;
            for (let taskData of oDataItems) {
                // start build json model for rows
                if (taskData.sumnr != '00000000') continue;
                iItemPos += 1;
                let oRowObject = {
                    aufpl: taskData.aufpl,
                    aplzl: taskData.aplzl,
                    item_pos: iItemPos,
                    sumnr: taskData.sumnr,
                    ref_mpoint: taskData.ref_mpoint,
                    values: {}
                };

                let skipForMpoint = false;
                for (let colData of this._oChecklistHeader.toColumn.results) {
                    if (colData.has_subcol == "X" || colData.is_hidden == "X") continue;
                    if (colData.col_type == "L") continue;

                    let cellKey = colData.col_name;
                    if (colData.col_type == 'A') {
                        let oVal = this._oChecklistData.to_Item.results.find(function (el) {
                            return el.keyname == cellKey;
                        });
                        oRowObject.values[cellKey] = oVal == undefined ? "" : oVal.atwrt;
                    } else if (colData.col_type == "V") {
                        let sFound = false;
                        for (let subOp of aItemCopy) {
                            if (subOp.sumnr != taskData.aplzl) continue;
                            if (subOp.cl_action == colData.col_name) {
                                sFound = true;
                                break;
                            }
                        }

                        if (taskData.ref_mpoint) {
                            if (!skipForMpoint) {
                                const aPoint = ["mpoint", "atawe", "upper_limit", "lower_limit"];
                                for (let index = 0; index < aPoint.length; index++) {
                                    const el = aPoint[index];
                                    let oVal = this._oChecklistData.to_Item.results.find(function (el) {
                                        return el.keyname == cellKey;
                                    });
                                    oRowObject.values[cellKey] = oVal == undefined ? "" : oVal.atwrt;
                                    skipForMpoint = true;
                                }
                            }
                        }
                        if (!skipForMpoint && sFound) {
                            let oVal = this._oChecklistData.to_Item.results.find(function (el) {
                                return el.keyname == cellKey;
                            });
                            oRowObject.values[cellKey] = oVal == undefined ? "" : oVal.atwrt;
                        }
                    }
                }

                const oRowJsonModel = models.createJSONModel(oRowObject);
                let sModelName = taskData.aufpl + "_" + taskData.aplzl;
                this.getView().setModel(oRowJsonModel, sModelName);
                this._aRowModels.push({
                    aufpl: taskData.aufpl,
                    aplzl: taskData.aplzl,
                    name: sModelName
                });
            };
        },

        callPostChecklist: function () {
            const oModel = this.getView().getModel();
            oModel.callFunction("/ZC_PMChecklistHeaderApprove_post", {
                method: "POST",
                urlParameters: {
                    chkid: this._oChecklistData.chkid,
                    IsActiveEntity: true
                },
                success: function (oData) {
                    sap.m.MessageToast.show("Checklist submitted successfully.");
                },
                error: function (oError) {
                    sap.m.MessageBox.error("Error submitting checklist.");
                }
            });
        }
    });
});