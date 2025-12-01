sap.ui.define([
    "zpmchecklist/controller/BaseController",
    "zpmchecklist/model/models"
], function (BaseController, models) {
    "use strict";

    return BaseController.extend("zpmchecklist.controller.Create", {
        onInit: function () {
            this.onFileChange = this.onFileChange.bind(this);
            this.onAddLeaderPress = this.onAddLeaderPress.bind(this);

            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("create").attachMatched(this._onRouteMatched, this);
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
                const oChecklistHeaderModel = models.createJSONModel(oDataHeader);
                this.getView().setModel(oChecklistHeaderModel, "oChecklistHeaderModel");

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
                    return a.vornr - b.vornr;
                });

                this._buildCreateModel(oDataItems);
                this._setupPage(oDataItems);
            } catch (error) {
                console.error(error);
            }
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

        _createChecklist: function () {
            // Implement checklist creation logic here
            const oModel = this.getOwnerComponent().getModel();
            const oView = this.getView();
            const oViewModel = oView.getModel("oViewModel");

            const oNewChecklist = {
                aufnr: oViewModel.getProperty("/aufnr"),
                chkty: "A",
                cstat: "N",
                cvhid: this._oChecklistHeader.cvhid,
                IsActiveEntity: true
            };
            oNewChecklist.to_Item = [];
            oNewChecklist.to_Partner = [];
            oNewChecklist.to_Attachment = [];

            let itemNumber = 0;
            // let itemLength = 4;
            for (let rowModel of this._aRowModels) {
                const sRowModelName = rowModel.aufpl + "_" + rowModel.aplzl;
                const oRowModel = this.getView().getModel(sRowModelName);
                const oRowData = oRowModel.getData();

                itemNumber += 1;
                for (let val in oRowData.values) {
                    const oNewItem = {
                        aufpl: oRowData.aufpl,
                        aplzl: oRowData.aplzl,
                        // itemno: itemNumber,  //.toString().padStart(itemLength, '0'),
                        ref_mpoint: oRowData.ref_mpoint,
                        key_type: oRowData.key_type,
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

            const oChecklistModel = oView.getModel("oChecklistModel");
            for (let oPartner of oChecklistModel.getProperty("/to_Partner/results")) {
                if (oPartner.bp_name) {
                    const oNewPartner = {
                        aufnr: oPartner.aufnr,
                        // itemno: oPartner.itemno,
                        bp_name: oPartner.bp_name,
                        bp_func: oPartner.bp_func,
                        // keydate: oPartner.keydate,
                        // start_time: oPartner.start_time,
                        // finish_time: oPartner.finish_time,
                        IsActiveEntity: true
                    };
                    oNewChecklist.to_Partner.push(oNewPartner);
                }
            }

            for (let oAttachment of oChecklistModel.getProperty("/to_Attachment/results")) {
                if (oAttachment.att_url) {
                    const oNewAttachment = {
                        aufnr: oAttachment.aufnr,
                        // itemno: oAttachment.itemno,
                        att_type: oAttachment.att_type,
                        obj_type: oAttachment.obj_type,
                        att_url: oAttachment.att_url,
                        att_bin: oAttachment.att_bin,
                        IsActiveEntity: true
                    };
                    oNewChecklist.to_Attachment.push(oNewAttachment);
                }
            }

            const that = this;
            oModel.create("/ZC_PMChecklistHeader", oNewChecklist, {
                success: function (oData) {
                    that.getView().getModel("oViewModel").setProperty("/isNew", false);
                    sap.m.MessageBox.show("Checklist created successfully!");
                    that.onBack();
                },
                error: function (oError) {
                    sap.m.MessageBox.error("Error creating checklist.");
                }
            });

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
                IsActiveEntity: true,
                to_Item: [],
                to_Partner: {
                    results: [
                        // {
                        //     chkid: "",
                        //     chkno: "",
                        //     aufnr: oViewData.aufnr,
                        //     itemno: "1",
                        //     bp_name: "Fulan bin Fulan",
                        //     bp_func: "Function 1",
                        //     bp_position: "leader",
                        //     keydate: "",
                        //     start_time: "",
                        //     finish_time: ""
                        // }
                    ],
                },
                to_Attachment: {
                    results: [
                        {
                            chkid: "",
                            chkno: "",
                            aufnr: oViewData.aufnr,
                            itemno: "1",
                            att_type: "",
                            obj_type: "BUS2007",  //PMAUFK
                            att_url: "",
                            att_bin: ""
                        },
                        {
                            chkid: "",
                            chkno: "",
                            aufnr: oViewData.aufnr,
                            itemno: "2",
                            att_type: "",
                            obj_type: "BUS2007",  //PMAUFK
                            att_url: "",
                            att_bin: ""
                        },
                        {
                            chkid: "",
                            chkno: "",
                            aufnr: oViewData.aufnr,
                            itemno: "2",
                            att_type: "",
                            obj_type: "BUS2007",   //PMAUFK
                            att_url: "",
                            att_bin: ""
                        }
                    ]
                }
            }
            const oChecklistModel = models.createJSONModel(oChecklistData);
            this.getView().setModel(oChecklistModel, "oChecklistModel");

            this._buildContent();
        },

        onBack: function (oEvent) {
            const oRouter = this.getOwnerComponent().getRouter();
            this.onExit();
            const oCreatePage = this.getView().byId("createPage");
            if (oCreatePage) {
                oCreatePage.destroyContent();
            }
            oRouter.navTo("main");
        },

        _buildCreateModel: function (oDataItems) {
            // const aItemCopy = oDataItems.slice();
            // oData.sort(function (a, b) { return a.vornr - b.vornr });
            let iItemPos = 0;
            for (let taskData of oDataItems) {
                // start build json model for rows
                // if (taskData.sumnr != '00000000') continue;
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
                        oRowObject.values[cellKey] = "";
                    } else if (colData.col_type == "V") {
                        // let sFound = false;
                        // for (let subOp of aItemCopy) {
                        //     if (subOp.sumnr != taskData.aplzl) continue;
                        //     if (subOp.cl_action == colData.col_name) {
                        //         sFound = true;
                        //         break;
                        //     }
                        // }
                        let aVals = taskData.column_list ? taskData.column_list.split(",").map(function(item) {return item.trim()}) : [];
                        let sFound = aVals.includes(colData.col_name);

                        if (taskData.ref_mpoint) {
                            if (!skipForMpoint) {
                                // const aPoint = ["mpoint", "atawe", "upper_limit", "lower_limit"];
                                for (let index = 0; index < aVals.length; index++) {
                                    const el = aVals[index];
                                    oRowObject.values[el] = taskData[el] || "";
                                    skipForMpoint = true;
                                }
                            }
                        }
                        if (!skipForMpoint && sFound) {
                            oRowObject.values[cellKey] = "";
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
        }
    });
});