sap.ui.define([
    "sap/ui/core/BusyIndicator",
    "zpmchecklist/controller/BaseController",
    "zpmchecklist/model/models",
    "zpmchecklist/model/validator"
], function (BusyIndicator, BaseController, models, validator) {
    "use strict";

    return BaseController.extend("zpmchecklist.controller.Create", {
        onInit: function () {
            // this.onFileChange = this.onFileChange.bind(this);
            // this.onAddLeaderPress = this.onAddLeaderPress.bind(this);
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("create").attachMatched(this._onRouteMatched, this);
        },

        _onRouteMatched: function (oEvent) {
            const oArgs = oEvent.getParameter("arguments");
            const oViewData = {
                list: [{ key: "Y", text: "Y" }, { key: "N", text: "N" }],
                aufnr: oArgs.aufnr,
                isNew: true,
                allowEdit: true,
                viewMode: "create"
            };
            const oJsonModel = models.createJSONModelOne(oViewData);
            this.getView().setModel(oJsonModel, "oViewModel");

            const oChecklistData = {
                aufnr: oViewData.aufnr,
                chkty: "A",
                cstat: "N",
                cvhid: this._oChecklistHeader.cvhid,
                gstri: null,
                gltri: null,
                loekz: "",
                IsActiveEntity: true,
                to_Item: [],
                to_Partner: {
                    results: [],
                },
                to_Approver: {
                    results: [],
                },
                to_Attachment: {
                    results: []
                }
            }

            for (let i = 0; i < 9; i++) {
                let itemno = i + 1;
                oChecklistData.to_Partner.results.push({
                    chkid: "",
                    chkno: "",
                    aufnr: "",
                    itemno: itemno,
                    bp_id: "",
                    bp_name: "",
                    bp_func: "",
                    bp_position: "leader",
                    loekz: "X"
                });
            }

            for (let i = 0; i < 3; i++) {
                oChecklistData.to_Attachment.results.push({
                    chkid: "",
                    chkno: "",
                    aufnr: oViewData.aufnr,
                    itemno: i.toString(),
                    att_type: "",
                    obj_type: "BUS2007",   //PMAUFK
                    att_url: "",
                    att_bin: ""
                });
            }

            for (let i = 0; i < 3; i++) {
                let itemno = i + 1;
                oChecklistData.to_Approver.results.push({
                    aufnr: oViewData.aufnr,
                    itemno: itemno.toString(),
                    bp_id: "",
                    bp_name: "",
                    bp_func: "",
                    bp_position: ""
                });
            }

            const oChecklistModel = models.createJSONModel(oChecklistData);
            this.getView().setModel(oChecklistModel, "oChecklistModel");

            this._buildContent();
        },

        _buildContent: async function () {
            // const oComponent = this.getOwnerComponent();
            const oView = this.getView();
            const oModel = oView.getModel();
            const oViewModel = oView.getModel("oViewModel");
            const sAufnr = oViewModel.getProperty("/aufnr");

            const that = this;
            // try {
            const oDataHeader = await new Promise(function (resolve, reject) {
                oModel.read("/ViewHeaderSet(ingpr='',aufnr='" + sAufnr + "')", {
                    urlParameters: {
                        "$expand": "toColumn"
                    },
                    success: function (oData) {
                        resolve(oData);
                    },
                    error: function (oError) {
                        var sErrorMessage = JSON.parse(oError.responseText).error.message.value;
                        sap.m.MessageBox.show(sErrorMessage, {
                            icon: sap.m.MessageBox.Icon.ERROR,
                            title: "Validation Error",
                            actions: [sap.m.MessageBox.Action.OK],
                            onClose: function () {
                                that.onBack();
                            }
                        });
                        // reject(oError);
                    }
                });
            });

            this._oChecklistHeader = oDataHeader;
            const oChecklistHeaderModel = models.createJSONModel(oDataHeader);
            this.getView().setModel(oChecklistHeaderModel, "oChecklistHeaderModel");

            // } catch (oError) {
            //     var sErrorMessage = JSON.parse(oError.responseText).error.message.value;
            //     sap.m.MessageBox.show(sErrorMessage, {
            //         icon: sap.m.MessageBox.Icon.ERROR,
            //         title: "Validation Error",
            //         actions: [sap.m.MessageBox.Action.OK],
            //         onClose: function () {
            //             this.onBack();
            //         }
            //     });
            // }

            BusyIndicator.show(10);
            // try {
            const oDataItems = await new Promise(function (resolve, reject) {
                oModel.read("/ViewItemSet", {
                    filters: [
                        new sap.ui.model.Filter("aufnr", sap.ui.model.FilterOperator.EQ, sAufnr)
                    ],
                    success: function (oData) {
                        resolve(oData.results);
                        BusyIndicator.hide();
                    },
                    error: function (oError) {
                        reject(oError);
                        BusyIndicator.hide();
                    }
                });
            });

            oDataItems.sort(function (a, b) {
                return a.vornr - b.vornr;
            });
            // } catch (error) {
            //     console.error(error);
            // }

            this._buildCreateModel(oDataItems);
            this._setupPage(oDataItems);
        },

        _setupPage: function (oData) {
            const oPage = this.getView().byId("createPage");
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

        onCreate: function () {
            // this.byId("createButton").setVisible(false);
            // this.byId("cancelButton").setVisible(false);
            this._createChecklist();
        },

        onCancel: function () {
            this.byId("cancelButton").setVisible(false);
            // this.byId("createButton").setVisible(false);
            this.byId("editButton").setVisible(true);
        },

        // Implement checklist creation logic here
        _createChecklist: function () {
            const oModel = this.getOwnerComponent().getModel();
            const oView = this.getView();
            const oViewModel = oView.getModel("oViewModel");
            const oChecklistModel = oView.getModel("oChecklistModel");

            let sGstri = oChecklistModel.getProperty("/gstri");
            let sGltri = oChecklistModel.getProperty("/gltri");
            if (validator.dateIsFuture(sGstri)) {
                sap.m.MessageBox.error("Actual Start tidak boleh di masa datang");
                return;
            }
            if (validator.dateIsFuture(sGltri)) {
                sap.m.MessageBox.error("Actual Finish tidak boleh di masa datang");
                return;
            }
            if (validator.startDateIsLater(sGstri, sGltri)) {
                sap.m.MessageBox.error("Actual Start tidak boleh setelah Actual Finish");
                return;
            }

            let firstApprover = oChecklistModel.getProperty("/to_Approver/results/0/bp_name");
            if (!firstApprover.length > 0) {
                sap.m.MessageBox.error("Harus ada Checked By");
                return;
            }

            let defPartner = oChecklistModel.getProperty("/to_Partner/results").filter(function(el) {
                return el.loekz == "";
            });

            if (defPartner.length == 0) {
                sap.m.MessageBox.error("Setidaknya harus ada 1 Leader");
                return;
            }

            const oNewChecklist = {
                aufnr: oViewModel.getProperty("/aufnr"),
                chkty: "A",
                cstat: "N",
                cvhid: this._oChecklistHeader.cvhid,
                gstri: sGstri,
                gltri: sGltri,
                // loekz: oChecklistModel.loekz,
                IsActiveEntity: true
            };
            oNewChecklist.to_Item = [];
            oNewChecklist.to_Partner = [];
            oNewChecklist.to_Approver = [];
            oNewChecklist.to_Attachment = [];

            let itemPos = 0;
            for (let rowModel of this._aRowModels) {
                const sRowModelName = rowModel.aufpl + "_" + rowModel.aplzl;
                const oRowModel = this.getView().getModel(sRowModelName);
                const oRowData = oRowModel.getData();

                itemPos += 1;
                let itemNumber = 0;
                for (let val in oRowData.values) {
                    if (val != "remark" && val.sval == "") {
                        sap.m.MessageBox.error("Ada field yang belum terisi");
                        return;
                    }
                    itemNumber += 1;
                    const oNewItem = {
                        aufpl: oRowData.aufpl,
                        aplzl: oRowData.aplzl,
                        itemno: itemNumber.toString().padStart(6, '0'),
                        // itempos: itemPos.toString().padStart(6, '0'),
                        ref_mpoint: oRowData.ref_mpoint,
                        key_type: oRowData.key_type,
                        val_type: oRowData.val_type,
                        IsActiveEntity: true
                    };
                    oNewItem.keyname = val;
                    oNewItem.atwrt = oRowData.values[val].sval;
                    oNewChecklist.to_Item.push(oNewItem);
                }
            }

            let itemNumber = 0;
            for (let oPartner of oChecklistModel.getProperty("/to_Partner/results")) {
                itemNumber += 1;
                // if (oPartner.bp_name) {
                const oNewPartner = {
                    aufnr: oPartner.aufnr,
                    itemno: itemNumber.toString().padStart(6, '0'),
                    bp_id: oPartner.bp_id,
                    bp_name: oPartner.bp_name,
                    bp_func: oPartner.bp_func,
                    loekz: oPartner.loekz, 
                    IsActiveEntity: true
                };
                oNewChecklist.to_Partner.push(oNewPartner);
                // }
            }
            // if (itemNumber <= 0) {
            //     sap.m.MessageBox.show("Setidaknya harus ada 1 Leader", {
            //         icon: sap.m.MessageBox.Icon.ERROR,
            //         title: "Validation Error",
            //         actions: [sap.m.MessageBox.Action.OK],
            //         // onClose: function () {
            //         //     // that.onBack();
            //         // }
            //     });
            //     return;
            // }

            itemNumber = 0;
            for (let oApprover of oChecklistModel.getProperty("/to_Approver/results")) {
                itemNumber += 1;
                // if (oApprover.bp_name) {
                const oNewApprover = {
                    aufnr: oApprover.aufnr,
                    itemno: itemNumber.toString().padStart(6, '0'),
                    bp_id: oApprover.bp_id,
                    bp_name: oApprover.bp_name,
                    bp_func: oApprover.bp_func,
                    IsActiveEntity: true
                };
                oNewChecklist.to_Approver.push(oNewApprover);
                // }
            }
            if (itemNumber <= 0) {
                sap.m.MessageBox.show("Approver tidak boleh kosong", {
                    icon: sap.m.MessageBox.Icon.ERROR,
                    title: "Validation Error",
                    actions: [sap.m.MessageBox.Action.OK],
                    // onClose: function () {
                    //     // that.onBack();
                    // }
                });
                return;
            }

            itemNumber = 0;
            for (let oAttachment of oChecklistModel.getProperty("/to_Attachment/results")) {
                itemNumber += 1;
                // if (oAttachment.att_url) {
                const oNewAttachment = {
                    aufnr: oAttachment.aufnr,
                    itemno: itemNumber.toString().padStart(6, '0'),
                    att_type: oAttachment.att_type,
                    obj_type: oAttachment.obj_type,
                    att_url: oAttachment.att_url,
                    att_bin: oAttachment.att_bin,
                    IsActiveEntity: true
                };
                oNewChecklist.to_Attachment.push(oNewAttachment);
                // }
            }

            const that = this;
            oModel.create("/ZC_PMChecklistHeader", oNewChecklist, {
                success: function (oData) {
                    that.getView().getModel("oViewModel").setProperty("/isNew", false);
                    sap.m.MessageBox.show("Checklist created successfully!", {
                        icon: sap.m.MessageBox.Icon.SUCCESS,
                        title: "Success",
                        actions: [sap.m.MessageBox.Action.OK],
                        onClose: function () {
                            that.onBack();
                        }
                    });
                },
                error: function (oError) {
                    sap.m.MessageBox.error("Error creating checklist.");
                }
            });
        },

        onBack: function (oEvent) {
            const oRouter = this.getOwnerComponent().getRouter();
            this.onExit();
            const oCreatePage = this.getView().byId("createPage");
            if (oCreatePage) {
                oCreatePage.destroyContent();
            }
            oRouter.navTo("main", {}, true);
        },

        _buildCreateModel: function (oDataItems) {
            let iItemPos = 0;
            let aRowModel = {};
            for (let taskData of oDataItems) {
                // start build json model for rows
                if (taskData.steus == 'INT1') continue;
                iItemPos += 1;
                let oRowObject = {
                    category: taskData.category,
                    aufpl: taskData.aufpl,
                    aplzl: taskData.aplzl,
                    itempos: iItemPos,
                    sumnr: taskData.sumnr,
                    ref_mpoint: taskData.ref_mpoint,
                    ref_image: taskData.ref_image,
                    values: {}
                };

                let skipForMpoint = false;
                for (let colData of this._oChecklistHeader.toColumn.results) {
                    if (colData.has_subcol == "X" || colData.is_hidden == "X") continue;
                    if (colData.col_type == "L") continue;

                    let cellKey = colData.col_name;
                    if (colData.col_type == 'A') {
                        // oRowObject.values[cellKey] = "";
                        oRowObject.values[cellKey] = {
                            sval: "",
                            chitid: "",
                            itemno: ""
                        };
                    } else if (colData.col_type == "V") {
                        let aVals = taskData.column_list ? taskData.column_list.split(",").map(function (item) { return item.trim() }) : [];
                        let sFound = aVals.includes(colData.col_name);

                        if (taskData.ref_mpoint) {
                            if (!skipForMpoint) {
                                // const aPoint = ["mpoint", "atawe", "upper_limit", "lower_limit"];
                                for (let index = 0; index < aVals.length; index++) {
                                    const el = aVals[index];
                                    // oRowObject.values[el] = taskData[el] || "";
                                    oRowObject.values[el] = {
                                        sval: taskData[el] || "",
                                        chitid: "",
                                        itemno: ""
                                    };
                                    skipForMpoint = true;
                                }
                            }
                        }
                        if (!skipForMpoint && sFound) {
                            // oRowObject.values[cellKey] = "";
                            oRowObject.values[cellKey] = {
                                sval: "",
                                chitid: "",
                                itemno: ""
                            };
                        }
                    }
                }
                const oRowJsonModel = models.createJSONModel(oRowObject);
                let sModelName = taskData.aufpl + "_" + taskData.aplzl;
                this.getView().setModel(oRowJsonModel, sModelName);
                this._aRowModels.push({
                    aufpl: taskData.aufpl,
                    aplzl: taskData.aplzl,
                    name: sModelName,
                    category: taskData.category
                });
                aRowModel[sModelName] = oRowObject;
            };
            const oNewRowModel = models.createJSONModel(aRowModel);
            this.getView().setModel(oNewRowModel, "oNewRowModel");
        }
    });
});