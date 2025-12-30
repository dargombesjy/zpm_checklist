sap.ui.define([
    "sap/ui/core/BusyIndicator",
    "zpmchecklist/controller/BaseController",
    "zpmchecklist/model/models",
    "sap/m/Dialog",
    "sap/m/DialogType",
    "zpmchecklist/model/formatter",
    "zpmchecklist/util/pdfmake.min",
    "zpmchecklist/util/vfs_fonts.min",
    "zpmchecklist/util/html2pdfmake",
    "zpmchecklist/util/himalaya"
], function (BusyIndicator, BaseController, models, Dialog, DialogType, formatter) {
    "use strict";

    return BaseController.extend("zpmchecklist.controller.Detail", {
        onInit: function () {
            this._createPdf = this._createPdf.bind(this);
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("detail").attachMatched(this._onRouteMatched, this);
        },

        _onRouteMatched: function (oEvent) {
            const oArgs = oEvent.getParameter("arguments");
            const oViewData = {
                list: [{ key: "Y", text: "Y" }, { key: "N", text: "N" }],
                aufnr: oArgs.aufnr,
                isApproved: true,
                allowEdit: false,
                allowPost: false,
                allowReject: false,
                allowChange: false,
                viewMode: "display"
            };
            const oJsonModel = models.createJSONModel(oViewData);
            this.getView().setModel(oJsonModel, "oViewModel");
            // this._setHtmlToJson = true;
            this._buildContent();
        },

        _buildContent: async function () {
            // const oComponent = this.getOwnerComponent();
            const oView = this.getView();
            const oModel = oView.getModel();
            const oViewModel = oView.getModel("oViewModel");
            const sAufnr = oViewModel.getProperty("/aufnr");

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
            if (oDataHeader.cstat == "N") {
                oViewModel.setProperty("/allowChange", true);
                oViewModel.setProperty("/allowEdit", false);
                oViewModel.setProperty("/isApproved", false);
                // A = Approver
                if (oDataHeader.is_approver == "A") {
                    oViewModel.setProperty("/allowPost", true);
                    oViewModel.setProperty("/allowReject", true);
                    // P = Planner
                } else if (oDataHeader.is_approver == "P") {
                    oViewModel.setProperty("/allowReject", true);
                }
            } else if (oDataHeader.cstat == "A" || oDataHeader.cstat == "X") {
                oViewModel.setProperty("/allowChange", false);
                oViewModel.setProperty("/allowEdit", false);
                oViewModel.setProperty("/allowPost", false);
                oViewModel.setProperty("/allowReject", false);
            }

            const oChecklistHeaderModel = models.createJSONModel(oDataHeader);
            this.getView().setModel(oChecklistHeaderModel, "oChecklistHeaderModel");

            const oDataChecklist = await new Promise(function (resolve, reject) {
                BusyIndicator.show(10);
                oModel.read("/ZC_PMChecklistHeader", {
                    filters: [
                        new sap.ui.model.Filter("aufnr", sap.ui.model.FilterOperator.EQ, sAufnr),
                        new sap.ui.model.Filter("IsActiveEntity", sap.ui.model.FilterOperator.EQ, "true")
                    ],
                    urlParameters: {
                        "$expand": "to_Item,to_Partner,to_Approver,to_Attachment"
                    },
                    success: function (oData) {
                        resolve(oData.results);
                        BusyIndicator.hide();
                    },
                    error: function (oError) {
                        BusyIndicator.hide();
                        reject(oError);

                    }
                });
            });
            let oChecklistData = oDataChecklist[0];
            oChecklistData.to_Item.results.sort(function (a, b) {
                return a.aplzl - b.aplzl;
            });
            oChecklistData.to_Approver.results.sort(function (a, b) {
                return a.itemno - b.itemno;
            });
            oChecklistData.to_Attachment.results.sort(function (a, b) {
                return a.itemno - b.itemno;
            });

            const oChecklistModel = models.createJSONModel(oChecklistData);
            this.getView().setModel(oChecklistModel, "oChecklistModel");

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

            this._buildChangeModel(oDataItems);
            const oTableContainer = this.getView().byId("tableContainer");
            this._buildTable(oDataItems, oTableContainer);

            this._setupPage("RO");
        },

        _setupPage: function (sMode) {
            const oTableLeader = this.getView().byId("table-leaders");
            const oGstriRow = this.getView().byId("row-hdr-gstri");
            const oGltriRow = this.getView().byId("row-hdr-gltri");
            const oTable = this.getView().byId("table01");
            const oApprContainer = this.getView().byId("appr-container");

            if (sMode == "RO") {
                oGstriRow.destroyItems();
                const oNewGsLbl = new sap.m.Text({ text: "Actual Start", layoutData: [new sap.m.FlexItemData({ baseSize: "30%", growFactor: 1 })] })
                oGstriRow.addItem(oNewGsLbl);

                const oNewGstri = new sap.m.Text("pick-gstri", {
                    width: "100%",
                    text: {
                        path: "oChecklistModel>/gstri",
                        type: "sap.ui.model.type.DateTime"
                    },
                    layoutData: [new sap.m.FlexItemData({ baseSize: "60%", growFactor: 0 })]
                });
                oGstriRow.addItem(oNewGstri);

                oGltriRow.destroyItems();
                const oNewGlLbl = new sap.m.Text({ text: "Actual Finish", layoutData: [new sap.m.FlexItemData({ baseSize: "30%", growFactor: 1 })] })
                oGltriRow.addItem(oNewGlLbl);

                const oNewGltri = new sap.m.Text("pick-gltri", {
                    width: "100%",
                    text: {
                        path: "oChecklistModel>/gltri",
                        type: "sap.ui.model.type.DateTime"
                    },
                    layoutData: [new sap.m.FlexItemData({ baseSize: "60%", growFactor: 0 })]
                });
                oGltriRow.addItem(oNewGltri);

                oTableLeader.unbindAggregation("rows");
                const oTemplate = new sap.m.HBox({
                    alignContent: "Start",
                    justifyContent: "SpaceAround",
                    items: [
                        new sap.m.Text({
                            text: "{oChecklistModel>bp_name}",
                            layoutData: [new sap.m.FlexItemData({ baseSize: "50%", growFactor: 0 })]
                        }),
                        new sap.m.Text({
                            text: "{oChecklistModel>bp_func}", textAlign: "Center",
                            layoutData: [new sap.m.FlexItemData({ baseSize: "40%", growFactor: 0 })]
                        }),
                        new sap.m.Text({
                            text: "",
                            layoutData: [new sap.m.FlexItemData({ baseSize: "10%", growFactor: 0 })]
                        })
                    ]
                });

                oTableLeader.bindAggregation("rows", {
                    path: "oChecklistModel>/to_Partner/results",
                    filters: new sap.ui.model.Filter("loekz", sap.ui.model.FilterOperator.NE, "X"),
                    template: oTemplate
                });
                // }

                oTable.bindAggregation("rows", "oNewRowModel>/", this._buildRowRO.bind(this));

                oApprContainer.destroyItems();
                let i = 0;
                do {
                    let sPath = "{oChecklistModel>/to_Approver/results/" + i + "/bp_name}"
                    i++;
                    let sId = "approver" + i + "-cmb";
                    let oAppr = new sap.m.Text(sId, { text: sPath });
                    oApprContainer.addItem(oAppr);
                } while (i < 3);

            } else if (sMode == "RW") {

                oGstriRow.destroyItems();
                const oNewGsLbl = new sap.m.Text({ text: "Actual Start", layoutData: [new sap.m.FlexItemData({ baseSize: "30%", growFactor: 1 })] })
                oGstriRow.addItem(oNewGsLbl);

                const oNewGstri = new sap.m.DateTimePicker("pick-gstri", {
                    width: "100%",
                    change: this.onActualDateChange.bind(this),
                    enabled: "{oViewModel>/allowEdit}",
                    value: {
                        path: "oChecklistModel>/gstri",
                        type: "sap.ui.model.type.DateTime"
                    },
                    layoutData: [new sap.m.FlexItemData({ baseSize: "60%", growFactor: 0 })]
                });
                oGstriRow.addItem(oNewGstri);

                oGltriRow.destroyItems();
                const oNewGlLbl = new sap.m.Text({ text: "Actual Finish", layoutData: [new sap.m.FlexItemData({ baseSize: "30%", growFactor: 1 })] })
                oGltriRow.addItem(oNewGlLbl);

                const oNewGltri = new sap.m.DateTimePicker("pick-gltri", {
                    width: "100%",
                    change: this.onActualDateChange.bind(this),
                    enabled: "{oViewModel>/allowEdit}",
                    value: {
                        path: "oChecklistModel>/gltri",
                        type: "sap.ui.model.type.DateTime"
                    },
                    layoutData: [new sap.m.FlexItemData({ baseSize: "60%", growFactor: 0 })]
                });
                oGltriRow.addItem(oNewGltri);

                // if (oTableLeader) {
                oTableLeader.unbindAggregation("rows");
                const oTemplate = new sap.m.HBox({
                    alignContent: "Start",
                    justifyContent: "SpaceAround",
                    items: [
                        new sap.m.ComboBox({
                            width: "90%",
                            enabled: { path: "oViewModel>/allowEdit" },
                            items: {
                                path: "partnerVH>/ZC_PM0001_Partners_VH",
                                template: new sap.ui.core.Item({
                                    key: "{partnerVH>bp_id}",
                                    text: "{partnerVH>bp_name}"
                                }),
                                templateShareable: false
                            },
                            selectedKey: "{oChecklistModel>bp_id}",
                            selectionChange: this.onLeaderChange.bind(this),
                            layoutData: [new sap.m.FlexItemData({ baseSize: "50%", growFactor: 0 })]
                        }),
                        new sap.m.Text({
                            text: "{oChecklistModel>bp_func}", textAlign: "Center",
                            layoutData: [new sap.m.FlexItemData({ baseSize: "40%", growFactor: 0 })]
                        }),
                        new sap.m.Button({
                            icon: "sap-icon://delete",
                            visible: { path: "oViewModel>/allowEdit" },
                            press: this.onDelLeaderPress.bind(this)
                        })
                    ]
                });

                oTableLeader.bindAggregation("rows", {
                    path: "oChecklistModel>/to_Partner/results",
                    filters: new sap.ui.model.Filter("loekz", sap.ui.model.FilterOperator.NE, "X"),
                    template: oTemplate
                });
                // }

                oTable.bindAggregation("rows", "oNewRowModel>/", this._buildRow.bind(this));

                oApprContainer.destroyItems();
                let i = 0;
                do {
                    let sPath = "{oChecklistModel>/to_Approver/results/" + i + "/bp_id}"
                    i++;
                    let sId = "approver" + i + "-cmb";
                    let oAppr = new sap.m.ComboBox(sId, {
                        width: "100%", enabled: "{oViewModel>/allowEdit}", selectionChange: this.onApproverChange.bind(this),
                        change: this.onComboBoxChange.bind(this),
                        items: {
                            path: "partnerVH>/ZC_PM0001_Partners_VH",
                            template: new sap.ui.core.Item({
                                key: "{partnerVH>bp_id}",
                                text: "{partnerVH>bp_name}"
                            }),
                            templateShareable: false,
                        },
                        selectedKey: sPath
                    });
                    oApprContainer.addItem(oAppr);
                } while (i < 3);
            }
        },

        onEdit: function () {
            const oViewModel = this.getView().getModel("oViewModel");
            oViewModel.setProperty("/allowChange", false);
            oViewModel.setProperty("/allowEdit", true);
            if (oViewModel.getProperty("/allowPost") == true) {
                this.byId("postButton").setVisible(false);
            }
            if (oViewModel.getProperty("/allowReject") == true) {
                this.byId("rejectButton").setVisible(false);
            }

            this._setupPage("RW");

            const oNewRowModel = this.getView().getModel("oNewRowModel");
            oNewRowModel.attachPropertyChange(function (oEvent) {
                let sPath = oEvent.getParameter("context").sPath;
                sPath = sPath + "/isChanged";
                oNewRowModel.setProperty(sPath, true);
            });
        },

        onSave: function () {
            const oViewModel = this.getView().getModel("oViewModel");
            oViewModel.setProperty("/allowEdit", false);
            oViewModel.setProperty("/allowChange", true);
            if (oViewModel.getProperty("/allowPost") == true) {
                this.byId("postButton").setVisible(true);
            }
            if (oViewModel.getProperty("/allowReject") == true) {
                this.byId("rejectButton").setVisible(true);
            }
            this._changeChecklist();
        },

        onCancel: function () {
            const oViewModel = this.getView().getModel("oViewModel");
            oViewModel.setProperty("/allowEdit", false);
            oViewModel.setProperty("/allowChange", true);
            if (oViewModel.getProperty("/allowPost") == true) {
                this.byId("postButton").setVisible(true);
            }
            if (oViewModel.getProperty("/allowReject") == true) {
                this.byId("rejectButton").setVisible(true);
            }
        },

        onBack: function (oEvent) {
            const oRouter = this.getOwnerComponent().getRouter();
            this.onExit();
            // const oDetailPage = this.getView().byId("tableWrapper");  //("tableWrapper");
            // if (oDetailPage) {
            //     oDetailPage.destroyItems();
            // }
            const oTable = this.getView().byId("table01");
            if (oTable) {
                oTable.destroyColumn();
                oTable.unbindAggregation("rows");
            }
            oRouter.navTo("main", {}, true);
        },

        _buildChangeModel: async function (oDataItems) {

            const oChecklistModel = this.getView().getModel("oChecklistModel");
            let aRowModel = [];
            for (let taskData of oDataItems) {
                // start build json model for rows
                if (taskData.steus == "INT1") {
                    this._aGroupHeader.push(taskData);
                    // continue;
                }

                const aItemVals = oChecklistModel.getProperty("/to_Item/results").filter(function (el) {
                    return el.aufpl == taskData.aufpl && el.aplzl == taskData.aplzl;
                });

                let oRowObject = {
                    IsActiveEntity: aItemVals[0] == undefined ? true : aItemVals[0].IsActiveEntity,
                    category: taskData.category,
                    aufpl: taskData.aufpl,
                    aplzl: taskData.aplzl,
                    vornr: taskData.vornr,
                    sumnr: taskData.sumnr,
                    steus: taskData.steus,
                    sub_category: taskData.sub_category,
                    cl_action: taskData.cl_action,
                    cl_method: taskData.cl_method,
                    ref_mpoint: taskData.ref_mpoint,
                    ref_image: taskData.ref_image,
                    column_list: taskData.column_list,
                    upper_limit: taskData.upper_limit,
                    lower_limit: taskData.lower_limit,
                    atawe: taskData.atawe,
                    indct: taskData.indct,
                    recdv: taskData.recdv,
                    isChanged: false,
                    values: {}
                };

                let skipForMpoint = false;
                for (let colData of this._oChecklistHeader.toColumn.results) {
                    if (colData.has_subcol == "X" || colData.is_hidden == "X") continue;
                    if (colData.col_type == "L") continue;

                    let cellKey = colData.col_name;
                    if (colData.col_type == 'A') {
                        let oVal = aItemVals.find(function (el) {
                            return el.keyname == cellKey;
                        });
                        oRowObject.values[cellKey] = {
                            sval: oVal == undefined ? "" : oVal.atwrt,
                            chitid: oVal == undefined ? "" : oVal.chitid,
                            itemno: oVal == undefined ? "" : oVal.itemno
                        };
                    } else if (colData.col_type == "V") {
                        let aVals = taskData.column_list ? taskData.column_list.split(",").map(function (item) { return item.trim() }) : [];
                        let sFound = aVals.includes(colData.col_name);

                        if (taskData.ref_mpoint) {
                            if (!skipForMpoint) {
                                // const aPoint = ["mpoint", "atawe", "lower_limit", "upper_limit"];
                                for (let index = 0; index < aVals.length; index++) {
                                    const elPoint = aVals[index];
                                    let oVal = aItemVals.find(function (el) {
                                        return el.keyname == elPoint;
                                    });
                                    oRowObject.values[elPoint] = {
                                        sval: oVal == undefined ? "" : oVal.atwrt,
                                        chitid: oVal == undefined ? "" : oVal.chitid,
                                        itemno: oVal == undefined ? "" : oVal.itemno
                                    };
                                    skipForMpoint = true;
                                }
                            }
                        }
                        if (!skipForMpoint && sFound) {
                            let oVal = aItemVals.find(function (el) {
                                return el.keyname == cellKey;
                            });
                            oRowObject.values[cellKey] = {
                                sval: oVal == undefined ? "" : oVal.atwrt,
                                chitid: oVal == undefined ? "" : oVal.chitid,
                                itemno: oVal == undefined ? "" : oVal.itemno
                            };
                        }
                    }
                }

                aRowModel.push(oRowObject);
            };

            const oNewRowModel = models.createJSONModel(aRowModel);
            oNewRowModel.setSizeLimit(this._jsonSizeLimit);
            this.getView().setModel(oNewRowModel, "oNewRowModel");
        },

        _changeChecklist: function () {
            var oTmpModel = this.getView().getModel();  //ZPM_CHECKLIST001_SRV
            oTmpModel.setDefaultBindingMode(sap.ui.model.BindingMode.TwoWay);
            oTmpModel.setUseBatch(true);
            oTmpModel.setDeferredGroups(["updateChecklist"]);
            const oChecklistModel = this.getView().getModel("oChecklistModel"); //.getData();  // JSON model

            if (this._validateOnSave(oChecklistModel) != "S") return;

            const sHeader = "/ZC_PMChecklistHeader";
            const oKey = {
                "chkid": oChecklistModel.getProperty("/chkid"),
                "IsActiveEntity": true  //oChecklistModel.getProperty("/IsActiveEntity")
            };
            const sHeaderPath = oTmpModel.createKey(sHeader, oKey);                         // OData model

            let iCount = 0;
            const oChangedChecklist = {
                chkty: oChecklistModel.getProperty("/chkty"),
                cstat: oChecklistModel.getProperty("/cstat"),
                gstri: oChecklistModel.getProperty("/gstri"),
                gltri: oChecklistModel.getProperty("/gltri"),
                IsActiveEntity: true
            };

            oTmpModel.update(sHeaderPath, oChangedChecklist, {
                groupId: "updateChecklist",
                chageSetId: "changeset" + iCount
                // success: function (oData, resp) {
                //     // console.log(resp);
                // },
                // error: function (error) {
                //     console.error(error);
                // }
            });

            const oNewRowModel = this.getView().getModel("oNewRowModel");
            const aChangedRows = oNewRowModel.getData().filter(function (el) {
                return el.isChanged;
            });

            for (let oRowData of aChangedRows) {
                for (let row in oRowData.values) {
                    if (row != "remark" && row != "lower_limit" && row != "upper_limit" && row != "recdv") {
                        if (oRowData.values[row].sval == "") {
                            sap.m.MessageBox.error("kolom " + row + " pada '" + oRowData.cl_action + "' belum diisi");
                            return;
                        }
                        if (row == "mpoint" && oRowData.indct && oRowData.recdv != "") {
                            let nLast = parseFloat(oRowData.recdv.trim());
                            if (nLast != NaN && nLast > oRowData.values[row].sval) {
                                sap.m.MessageBox.error("Isian " + oRowData.cl_action + " tidak boleh lebih kecil dari previous measurement");
                                return;
                            }
                        }
                    }
                    let oChangedItem = {
                        aufpl: oRowData.aufpl,
                        aplzl: oRowData.aplzl,
                        // chkid: oRowData.chkid,
                        chitid: oRowData.values[row].chitid,
                        itemno: oRowData.values[row].itemno,
                        ref_mpoint: oRowData.ref_mpoint,
                        key_type: oRowData.key_type,
                        val_type: oRowData.val_type,
                        keyname: row,
                        atwrt: oRowData.values[row].sval
                    };
                    const sCollection = "/ZC_PMChecklistItem";
                    const oKey1 = {
                        "chitid": oChangedItem.chitid,
                        "IsActiveEntity": oRowData.IsActiveEntity
                    };
                    const sItemPath = oTmpModel.createKey(sCollection, oKey1);

                    iCount += 1;
                    oTmpModel.update(sItemPath, oChangedItem, {
                        groupId: "updateChecklist",
                        changeSetId: "changeset" + iCount
                        // success: function (oData, resp) {
                        //     // console.log(resp);
                        // },
                        // error: function (error) {
                        //     console.error(error);
                        // }
                    });
                }
            }

            if (this._bLeaderChanged) {
                for (let oPartner of oChecklistModel.getProperty("/to_Partner/results")) {
                    // if (oPartner.bp_name == "") {
                    //     sap.m.MessageBox.show("Nama tidak boleh kosong", {
                    //         icon: sap.m.MessageBox.Icon.ERROR,
                    //         title: "Validation Error",
                    //         actions: [sap.m.MessageBox.Action.OK]
                    //     });
                    //     return;
                    // }
                    const oChangedPartner = {
                        aufnr: oPartner.aufnr,
                        itemno: oPartner.itemno,
                        bp_id: oPartner.bp_id,
                        bp_name: oPartner.bp_name,
                        bp_func: oPartner.bp_func,
                        loekz: oPartner.loekz,
                        IsActiveEntity: true
                    };

                    const sCollection = "/ZC_PMChecklistPartner_TP";
                    iCount += 1;
                    if (oPartner.chbpid == undefined) {
                        // itemNumber += 1;
                        // oChangedPartner.itemno = itemNumber.toString().padStart(6, '0');
                        // oTmpModel.create(sCollection, oChangedPartner, {
                        //     groupId: "updateChecklist",
                        //     changeSetId: "changeset" + iCount,
                        //     success: function (oData, resp) {
                        //         console.log(resp);
                        //     },
                        //     error: function (error) {
                        //         console.error(error);
                        //     }
                        // });
                    } else {
                        const oKey1 = {
                            "chbpid": oPartner.chbpid,
                            "IsActiveEntity": true
                        };
                        const sPartnerPath = oTmpModel.createKey(sCollection, oKey1);
                        oTmpModel.update(sPartnerPath, oChangedPartner, {
                            groupId: "updateChecklist",
                            changeSetId: "changeset" + iCount
                            // success: function (oData, resp) {
                            //     // console.log(resp);
                            // },
                            // error: function (error) {
                            //     console.error(error);
                            // }
                        });
                    }
                }
            }

            if (this._bApproverChanged) {
                for (let oApprover of oChecklistModel.getProperty("/to_Approver/results")) {
                    if (oApprover.bp_name) {
                        const oChangedApprover = {
                            aufnr: oApprover.aufnr,
                            // itemno: oApprover.itemno,
                            bp_id: oApprover.bp_id,
                            bp_name: oApprover.bp_name,
                            bp_func: oApprover.bp_func,
                            IsActiveEntity: true
                        };

                        const sCollection = "/ZC_PMChecklistApprover";
                        iCount += 1;
                        const oKey1 = {
                            "chapid": oApprover.chapid,
                            "IsActiveEntity": true
                        };
                        const sApproverPath = oTmpModel.createKey(sCollection, oKey1);

                        oTmpModel.update(sApproverPath, oChangedApprover, {
                            groupId: "updateChecklist",
                            changeSetId: "changeset" + iCount
                            // success: function (oData, resp) {
                            //     // console.log(resp);
                            // },
                            // error: function (error) {
                            //     console.error(error);
                            // }
                        });
                    }
                }
            }

            if (this._bAttachmentChanged) {
                for (let oAttachment of oChecklistModel.getProperty("/to_Attachment/results")) {
                    if (oAttachment.att_url) {
                        const oChangedAttachment = {
                            aufnr: oAttachment.aufnr,
                            // itemno: oAttachment.itemno,
                            att_type: oAttachment.att_type,
                            obj_type: oAttachment.obj_type,
                            att_url: oAttachment.att_url,
                            att_bin: oAttachment.att_bin,
                            IsActiveEntity: true
                        };

                        const sCollection = "/ZC_PMChecklistAttachment_TP";
                        iCount += 1;
                        const oKey1 = {
                            "chatid": oAttachment.chatid,
                            "IsActiveEntity": true
                        };
                        const sAttachmentPath = oTmpModel.createKey(sCollection, oKey1);

                        oTmpModel.update(sAttachmentPath, oChangedAttachment, {
                            groupId: "updateChecklist",
                            changeSetId: "changeset" + iCount
                            // success: function (oData, resp) {
                            //     // console.log(resp);
                            // },
                            // error: function (error) {
                            //     console.error(error);
                            // }
                        });
                    }
                }
            }

            let that = this;
            BusyIndicator.show(10);
            oTmpModel.submitChanges({
                // groupId: "updateChecklist",
                success: function (oData, resp) {
                    BusyIndicator.hide()
                    // sap.m.MessageToast.show("Checklist updated successfully!");
                    sap.m.MessageBox.show("Checklist updated successfully!", {
                        icon: sap.m.MessageBox.Icon.SUCCESS,
                        title: "Save Success",
                        actions: [sap.m.MessageBox.Action.OK],
                        onClose: function () {
                            that.onBack();
                        }
                    });
                },
                error: function (oError) {
                    console.error(oError);
                    BusyIndicator.hide()
                    sap.m.MessageBox.error("Error updating checklist.");
                }
            });
        },

        onApprovePress: function () {

            if (!this.oApproveDialog) {
                this.oApproveDialog = new Dialog({
                    type: DialogType.Message,
                    title: "Confirm",
                    content: new sap.m.Text({ text: "Anda yakin Approve?" }),
                    beginButton: new sap.m.Button({
                        type: sap.m.ButtonType.Emphasized,
                        text: "Approve",
                        press: function () {
                            this.oApproveDialog.close();
                            this.callPostChecklist();
                        }.bind(this)
                    }),
                    endButton: new sap.m.Button({
                        text: "Cancel",
                        press: function () {
                            this.oApproveDialog.close();
                        }.bind(this)
                    })
                });
            }
            this.oApproveDialog.open();
        },

        callPostChecklist: async function () {
            BusyIndicator.show();
            // const sPdf = await this.__createPdf();
            const sPdf = await this._createPdfMake();
            if (sPdf == undefined) {
                BusyIndicator.hide()
                sap.m.MessageBox.error("Generate PDF failed.");
                return;
            }
            const oModel = this.getView().getModel();
            oModel.setUseBatch(false);

            const oChecklistModel = this.getView().getModel("oChecklistModel");  // JSON model
            oChecklistModel.setProperty("/to_Attachment/results/2/att_url", sPdf);   // btoa(sPdf));
            const oPdfAttachment = oChecklistModel.getData().to_Attachment.results[2];

            const sCollection = "/ZC_PMChecklistAttachment_TP";
            // iCount += 1;
            const oKey = {
                "chatid": oChecklistModel.getProperty("/to_Attachment/results/2/chatid"),
                "IsActiveEntity": true
            };
            const sAttachmentPath = oModel.createKey(sCollection, oKey);
            const oChangedAttachment = {
                aufnr: oPdfAttachment.aufnr,
                itemno: oPdfAttachment.itemno,
                att_type: "print",
                obj_type: oPdfAttachment.obj_type,
                att_url: oPdfAttachment.att_url,
                att_bin: oPdfAttachment.att_bin,
                IsActiveEntity: true
            };

            let that = this;
            let oAttach = await new Promise(function (resolve, reject) {
                oModel.update(sAttachmentPath, oChangedAttachment, {
                    // groupId: "updateChecklist",
                    // changeSetId: "changeset" + iCount,
                    success: function (oData) {
                        resolve(oData)
                    },
                    error: function (oError) {
                        BusyIndicator.hide()
                        var sErrorMessage = JSON.parse(oError.responseText).error.message.value;
                        sap.m.MessageBox.show(sErrorMessage, {
                            icon: sap.m.MessageBox.Icon.ERROR,
                            title: "Generate PDF failed",
                            actions: [sap.m.MessageBox.Action.OK],
                            onClose: function () {
                                that.onBack();
                            }
                        });
                    }
                });
            })

            oModel.callFunction("/ZC_PMChecklistHeaderApprove_post", {
                method: "POST",
                urlParameters: {
                    chkid: oChecklistModel.getProperty("/chkid"),
                    IsActiveEntity: true
                },
                success: function (oData) {
                    BusyIndicator.hide();
                    sap.m.MessageBox.show("Checklist posted successfully!", {
                        icon: sap.m.MessageBox.Icon.SUCCESS,
                        title: "Success",
                        actions: [sap.m.MessageBox.Action.OK],
                        onClose: function () {
                            that.onBack();
                        }
                    });
                },
                error: function (oError) {
                    BusyIndicator.hide();
                    console.error(oError);
                    sap.m.MessageBox.error("Error submitting checklist.");
                }
            });
        },

        onRejectPress: function () {
            if (!this.oRejectDialog) {
                this.oRejectDialog = new Dialog({
                    type: DialogType.Message,
                    title: "Confirm",
                    content: new sap.m.Text({ text: "Anda yakin Reject?" }),
                    beginButton: new sap.m.Button({
                        type: sap.m.ButtonType.Emphasized,
                        text: "Reject",
                        press: function () {
                            this.oRejectDialog.close();
                            this.callRejectChecklist();
                        }.bind(this)
                    }),
                    endButton: new sap.m.Button({
                        text: "Cancel",
                        press: function () {
                            this.oRejectDialog.close();
                        }.bind(this)
                    })
                });
            }
            this.oRejectDialog.open();
        },

        callRejectChecklist: function () {
            const oChecklistModel = this.getView().getModel("oChecklistModel");
            const oModel = this.getView().getModel();
            oModel.setUseBatch(false);
            let that = this;
            oModel.callFunction("/ZC_PMChecklistHeaderReject", {
                method: "POST",
                urlParameters: {
                    chkid: oChecklistModel.getProperty("/chkid"),
                    IsActiveEntity: true
                },
                success: function (oData) {
                    BusyIndicator.hide();
                    sap.m.MessageBox.show("Done reject Checklist", {
                        icon: sap.m.MessageBox.Icon.SUCCESS,
                        title: "Success",
                        actions: [sap.m.MessageBox.Action.OK],
                        onClose: function () {
                            that.onBack();
                        }
                    });
                },
                error: function (oError) {
                    BusyIndicator.hide();
                    console.error(oError);
                    sap.m.MessageBox.error("Error rejecting checklist.");
                }
            });
        },

        _createPdf: async function () {
            // let oViewModel = this.getView().getModel("oViewModel");
            // let sAufnr = oViewModel.getProperty("/aufnr");
            // let oNow = new Date();
            // let oMonth = oNow.getMonth() + 1;
            // let sFilename = sAufnr + "_" + oNow.getFullYear() + oMonth + oNow.getDate() + "_checksheet.pdf";
            // const oOptions = {
            //     // margin: [0.3, 0, 0.5, 0],
            //     margin: [0.15, 0, 0.2, 0],
            //     filename: sFilename,
            //     image: { type: 'jpeg', quality: 0.98 },
            //     html2canvas: { scale: 2 },
            //     jsPDF: { unit: 'in', format: 'a4', orientation: 'p' },
            //     pagebreak: { mode: ["avoid-all", "css"] } //{ avoid: 'img' }
            // };



            // const oView = this.getView();
            // const printElement = oView.byId("checklistContainer").getDomRef();
            // // const headerElement = oView.byId("headerContainer").getDomRef();
            // // const tableElement = oView.byId("tableContainer").getDomRef();
            // // const footerElement = oView.byId("footerContainer").getDomRef();
            // // const imageElement = oView.byId("imageContainer").getDomRef();

            // // const jspdf = sap.ui.require("zpmchecklist/util/jspdf.umd.min");
            // const oPdf = new window.jspdf.jsPDF({
            //     orientation: "landscape",
            //     unit: "mm",
            //     format: "a4",
            //     compress: true
            // });
            // const nWindowWidth = 980;  // window.innerWidth;

            // await oPdf.html(printElement, {
            //     // callback: function (doc) {
            //     //     doc.output("save");
            //     // },
            //     margin: [10, 0, 10, 0],
            //     autoPaging: "text",
            //     // image: {
            //     //     type: "jpeg",
            //     //     quality: 0.8
            //     // },
            //     x: 0,
            //     y: 10,
            //     width: 210,
            //     windowWidth: nWindowWidth
            // });

            // // let headerHeight = this._pxToMm(headerElement.offsetHeight);
            // // headerHeight = Math.ceil(headerHeight);
            // // let tableHeight = this._pxToMm(tableElement.offsetHeight);
            // // tableHeight = Math.ceil(tableHeight);
            // // let footerHeight = this._pxToMm(footerElement.offsetHeight);
            // // footerHeight = Math.ceil(footerHeight);
            // // let imageHeight = this._pxToMm(imageElement.offsetHeight);
            // // imageHeight = Math.ceil(imageHeight) + 5;

            // // await oPdf.html(headerElement, {
            // //     // callback: function (doc) {
            // //     //     doc.output("save");
            // //     // },
            // //     margin: [10, 0, 10, 0],
            // //     // autoPaging: "text",
            // //     // image: {
            // //     //     type: "jpeg",
            // //     //     quality: 0.8
            // //     // },
            // //     x: 0,
            // //     y: 10,
            // //     width: 297,
            // //     windowWidth: nWindowWidth  // 980
            // // });

            // // await oPdf.html(tableElement, {
            // //     margin: [10, 0, 10, 0],
            // //     autoPaging: "text",
            // //     // image: {
            // //     //     type: "jpeg",
            // //     //     quality: 0.8
            // //     // },
            // //     jsPDF: oPdf,
            // //     x: 0,
            // //     y: headerHeight + 2,
            // //     width: 297,
            // //     windowWidth: nWindowWidth
            // // });

            // // let pageHeight = oPdf.internal.pageSize.getHeight();
            // // let pageWidth = oPdf.internal.pageSize.getWidth();
            // // let pageCount = oPdf.internal.getNumberOfPages();
            // // let contentHeight = headerHeight + tableHeight;
            // // let nPage = Math.trunc(contentHeight / pageHeight);
            // // let effHeight = nPage * (pageHeight + 20);
            // // let nRem = effHeight - contentHeight;

            // // // if (nRem > footerHeight) {
            // // //     oPdf.setPage(12);
            // // //     await oPdf.html(footerElement, {
            // // //         margin: [10, 0, 10, 0],
            // // //         // autoPaging: "text",
            // // //         // image: {
            // // //         //     type: "jpeg",
            // // //         //     quality: 0.8
            // // //         // },
            // // //         // jsPDF: oPdf,
            // // //         x: 0,
            // // //         y: 100,  //pageHeight - 10 - nRem,
            // // //         width: 210,
            // // //         windowWidth: nWindowWidth
            // // //     });
            // // //     nRem = nRem - footerHeight;
            // // // } else {
            // // //     oPdf.addPage();
            // // //     nPage += 1;
            // // //     oPdf.setPage(2);
            // // //     await oPdf.html(footerElement, {
            // // //         margin: [10, 0, 10, 0],
            // // //         // autoPaging: "text",
            // // //         // image: {
            // // //         //     type: "jpeg",
            // // //         //     quality: 0.8
            // // //         // },
            // // //         jsPDF: oPdf,
            // // //         x: 0,
            // // //         y: 10,
            // // //         width: 210,
            // // //         windowWidth: nWindowWidth
            // // //     });
            // // // }

            // // // if (nRem > imageHeight) {

            // // // }

            // const sTest = oPdf.output("blob");
            // oPdf.output("save");
            // // const sBase64 = oPdf.output("datauristring");
            // // var rawBase64 = sBase64.split(',')[1];
            // // return rawBase64;
        },

        _pxToMm: function (nPx) {
            const dpi = 96;
            const res = (nPx * 25.4) / dpi;
            return res;
        },

        _createPdfMake: async function () {
            let docDef = {
                content: [
                    { style: "tableCommon", table: {} },                    // header
                    { text: "Inspector (Leader)", style: "title" },         // leader title
                    { style: "tableCommon", table: {} },                    // leader table
                    {},                                                     // table title
                    {                                                       // table main
                        style: "tableCommon",
                        table: {
                            dontBreakRows: true,
                            body: []
                        }
                    }
                ],
                styles: {
                    tableCommon: {
                        marginBottom: 10
                    },
                    title: {
                        fontSize: 12,
                        bold: true
                    },
                    columnHeader: {
                        bold: true,
                        alignment: "center"
                    }
                },
                defaultStyle: {
                    fontSize: 10
                }
            }

            const oView = this.getView();
            const oChecklistHeaderModel = oView.getModel("oChecklistHeaderModel").getData();
            const oChecklistModel = oView.getModel("oChecklistModel").getData();

            // header
            docDef.content[0].table.body = [
                ["Order", { text: oChecklistHeaderModel.aufnr + " " + oChecklistHeaderModel.ktext, colSpan: 3 }, "", ""],
                ["Functional Location", { text: oChecklistHeaderModel.tplma + " " + oChecklistHeaderModel.pltxt, colSpan: 3 }, "", ""],
                ["Equipment", { text: oChecklistHeaderModel.equnr + " " + oChecklistHeaderModel.eqktx, colSpan: 3 }, "", ""],
                [
                    "Planner Group", oChecklistHeaderModel.ingpr + " " + oChecklistHeaderModel.innam,
                    "Actual Start", formatter.formatDateTime(oChecklistModel.gstri.toISOString().split("T"))
                ],
                [
                    "Work Center", oChecklistHeaderModel.arbpl + " " + oChecklistHeaderModel.cktext,
                    "Actual Finish", formatter.formatDateTime(oChecklistModel.gltri.toISOString().split("T"))
                ]
            ];
            docDef.content[0].table.widths = [100, 200, 80, "*"];

            // leader
            docDef.content[2].table.body = [
                [{ text: "Name", style: "columnHeader" }, { text: "Title", style: "columnHeader" }],
            ]
            docDef.content[2].table.widths = [260, "*"];

            for (let p of oChecklistModel.to_Partner.results) {
                if (p.loekz == "X") continue;
                docDef.content[2].table.body.push([
                    p.bp_name, p.bp_func
                ])
            }

            let tableContainer = oView.byId("tableContainer").getDomRef();
            let converted = htmlToPdfmake(tableContainer.innerHTML);
            let sTable = converted[0].stack[0].stack[0];
            let sTitle = sTable.stack.shift();

            // table title
            docDef.content[3].text = { text: sTitle.text, style: "title" };

            //table columns
            let sColumns = sTable.stack.shift();
            let sColumn1 = sColumns.stack.shift();
            let sColumn2 = sColumns.stack.shift();

            let aColumns = [];
            if (sColumn2.stack[0].stack) {
                aColumns.push({ text: sColumn1.text[0].text, rowSpan: 2, style: "columnHeader" });

                let sLength = sColumn2.stack[0].stack[1].stack.length;
                aColumns.push({ text: sColumn2.stack[0].stack[0].text[0].text, colSpan: sLength, style: "columnHeader" });
                sLength -= 1;
                do {
                    aColumns.push("");
                    sLength -= 1;
                } while (sLength > 0);

                let bColumns = [""];
                for (let col of sColumn2.stack[0].stack[1].stack) {
                    bColumns.push({ text: col.text[0].text, style: "columnHeader" });
                }

                for (let col of sColumns.stack) {
                    aColumns.push({ text: col.text[0].text, style: "columnHeader", rowSpan: 2 });
                    bColumns.push("");
                }

                docDef.content[4].table.body.push(aColumns);
                docDef.content[4].table.body.push(bColumns);
            } else {
                aColumns.push({ text: sColumn1.text[0].text, style: "columnHeader" });
                aColumns.push({ text: sColumn2.stack[0].text[0].text, colSpan: 4, style: "columnHeader" }, {}, {}, {});
                for (let col of sColumns.stack) {
                    aColumns.push({ text: col.text[0].text, style: "columnHeader" });
                }
                docDef.content[4].table.body.push(aColumns);
            }

            // table content
            // let test = 0;
            for (let row of sTable.stack) {
                // test += 1;
                // if (test == 8) break;
                let aRows = [];
                for (let cell of row.stack) {
                    if (cell.stack) {
                        if (oChecklistHeaderModel.ingpr == "LMP") {
                            if (cell.stack.length == 6) {
                                for (let sub of cell.stack) {
                                    aRows.push(sub.text[0].text);
                                }
                            } else if (cell.stack.length == 4) {
                                let i = 1;
                                for (let sub of cell.stack) {
                                    if (i == 1) {
                                        aRows.push({ text: formatter.formatNumber(sub.text[0].text), alignment: "right" });
                                    } else if (i < 3) {
                                        aRows.push({ text: sub.text[0].text });
                                    } else {
                                        aRows.push({ text: sub.text[0].text, colSpan: 2 });
                                        aRows.push("");
                                    }
                                    i += 1;
                                }
                            } else {
                                let i = 1;
                                for (let sub of cell.stack) {
                                    if (i == 1) {
                                        aRows.push({text: formatter.formatNumber(sub.text[0].text), colSpan: 2, alignment: "right"});
                                        aRows.push({text: ""});
                                    } else {
                                        aRows.push({text: sub.text[0].text, colSpan: 2});
                                        aRows.push({text: ""});
                                    }
                                }
                            }
                        } else {
                            if (cell.stack.length == 1) {
                                aRows.push({ text: cell.stack[0].text[0].text, colSpan: 4 }, {}, {}, {});
                            } else if (cell.stack.length == 4) {
                                for (let sub of cell.stack) {
                                    let i = 1;
                                    if (i == 1) {
                                        aRows.push({ text: formatter.formatNumber(sub.text[0].text), alignment: "right" });
                                    } else {
                                        aRows.push({ text: sub.text[0].text });
                                    }
                                    i += 1;
                                }
                            } else {
                                let i = 1;
                                for (let sub of cell.stack) {
                                    if (i == 1) {
                                        aRows.push({ text: formatter.formatNumber(sub.text[0].text), alignment: "right" });
                                    } else if (i < 3) {
                                        aRows.push({ text: sub.text[0].text });
                                    } else {
                                        aRows.push({ text: sub.text[0].text, colSpan: 2 });
                                        aRows.push("");
                                    }
                                    i += 1;
                                }
                            }
                        }

                    } else {
                        if (["label-col", "attr-col"].some(function (val) {
                            return cell.style.includes(val);
                        })) {
                            aRows.push({ text: cell.text[0].text });
                        }
                    }
                }
                docDef.content[4].table.body.push(aRows);
            }

            if (oChecklistHeaderModel.ingpr == "LMP") {
                docDef.content[4].table.widths = [200, 25, 25, 25, 25, 25, 25, "*"];
            } else {
                docDef.content[4].table.widths = [200, 50, "auto", "auto", "auto", "*"];
            }

            docDef.content.push({
                style: "tableCommon",
                columns: [
                    { width: "*", text: "" },
                    {
                        width: "auto",
                        table: {
                            dontBreakRows: true,
                            body: [
                                [
                                    {
                                        table: {
                                            widths: [100, 100, 100],
                                            heights: [20, 50, 20],
                                            body: [
                                                ["Checked By,", "Validated By,", "Confirmed By,"],
                                                ["", "", ""],
                                                [{ text: oChecklistModel.to_Approver.results[0].bp_name }, { text: oChecklistModel.to_Approver.results[1].bp_name }, { text: oChecklistModel.to_Approver.results[2].bp_name }]
                                            ]
                                        }
                                    }
                                ]
                            ]
                        }
                    },
                    { width: "*", text: "" }
                ]
            });

            let showImage = true;
            if (oChecklistModel.to_Attachment.results[0].att_url == "" && oChecklistModel.to_Attachment.results[1].att_url == "") {
                showImage = false;
            } else {
                if (oChecklistModel.to_Attachment.results[0].att_url == "") {
                    oChecklistModel.to_Attachment.results[0].att_url = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUAAAAEAAAABAAAAAECAYAAAAg+lkpAAAADUlEQVR4AWJiYGBgAAAAAP//XRcpzQAAAAZJREFUAwAADwADJDd96QAAAABJRU5ErkJggg=="
                }
                if (oChecklistModel.to_Attachment.results[1].att_url == "") {
                    oChecklistModel.to_Attachment.results[1].att_url = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUAAAAEAAAABAAAAAECAYAAAAg+lkpAAAADUlEQVR4AWJiYGBgAAAAAP//XRcpzQAAAAZJREFUAwAADwADJDd96QAAAABJRU5ErkJggg=="
                }
                // showImage = true;
            }

            if (showImage) {
                docDef.content.push({
                    style: "tableCommon",
                    pageBreak: "before",
                    columns: [
                        { width: "*", text: "" },
                        {
                            width: "auto",
                            // table: {
                            //     dontBreakRows: true,
                            //     body: [
                            //         {
                            table: {
                                body: [
                                    [
                                        { image: oChecklistModel.to_Attachment.results[0].att_url, width: 150 },
                                        "",
                                        { image: oChecklistModel.to_Attachment.results[1].att_url, width: 150 }
                                    ]
                                ]
                            }
                            //         }
                            //     ]
                            // }
                        },
                        { width: "*", text: "" }
                    ]
                });
            }

            // createPdf(docDef).print();
            // const oPdf = createPdf(docDef);
            // oPdf.getBase64(function(pdf) {
            //     return pdf;
            //     // console.log(pdf);
            // });

            const sBase64 = await new Promise(function(resolve, reject) {
                createPdf(docDef).getBase64(function(sPdf) {
                    resolve(sPdf);
                });
            });

            return sBase64;

        }
    });
});