sap.ui.define([
    "sap/ui/core/BusyIndicator",
    "zpmchecklist/controller/BaseController",
    "zpmchecklist/model/models",
    "zpmchecklist/model/validator"
], function (BusyIndicator, BaseController, models, validator) {
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
                viewMode: "display"
            };
            const oJsonModel = models.createJSONModel(oViewData);
            this.getView().setModel(oJsonModel, "oViewModel");

            this._buildContent();
        },

        _buildContent: async function () {
            // const oComponent = this.getOwnerComponent();
            const oView = this.getView();
            const oModel = oView.getModel();
            const oViewModel = oView.getModel("oViewModel");
            const sAufnr = oViewModel.getProperty("/aufnr");

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
                        reject(oError);
                    }
                });
            });
            this._oChecklistHeader = oDataHeader;
            if (oDataHeader.cstat == "N") {
                oViewModel.setProperty("/isApproved", false);
                if (oDataHeader.is_approver == "X") {
                    oViewModel.setProperty("/allowPost", true);
                }
            }

            const oChecklistHeaderModel = models.createJSONModel(oDataHeader);
            this.getView().setModel(oChecklistHeaderModel, "oChecklistHeaderModel");

            // } catch (error) {
            //     console.error(error);
            // }

            // try {
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
            this._oChecklistData = oDataChecklist[0];
            if (this._oChecklistData.cstat == "A") {
                oViewModel.setProperty("/allowEdit", false);
                oViewModel.setProperty("/allowPost", false);
            }
            this._oChecklistData.to_Item.results.sort(function (a, b) {
                return a.aplzl - b.aplzl;
            });
            let oChecklistModel = models.createJSONModel(this._oChecklistData);
            this.getView().setModel(oChecklistModel, "oChecklistModel");
            // } catch (error) {
            //     console.error(error);
            // }

            // try {
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
            this._setupPage(oDataItems);
            // } catch (error) {
            //     console.error(error);
            // }
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

        onEdit: function () {
            const oViewModel = this.getView().getModel("oViewModel");
            oViewModel.setProperty("/allowEdit", true);

            this.byId("editButton").setVisible(false);
            this.byId("saveButton").setVisible(true);
            this.byId("cancelButton").setVisible(true);
            if (oViewModel.getProperty("/allowPost") == true) {
                this.byId("postButton").setVisible(false);
            }
        },

        onSave: function () {
            const oViewModel = this.getView().getModel("oViewModel");
            oViewModel.setProperty("/allowEdit", false);

            this.byId("saveButton").setVisible(false);
            this.byId("editButton").setVisible(true);
            this.byId("cancelButton").setVisible(false);
            if (oViewModel.getProperty("/allowPost") == true) {
                this.byId("postButton").setVisible(true);
            }
            this._changeChecklist();
        },

        onCancel: function () {
            const oViewModel = this.getView().getModel("oViewModel");
            oViewModel.setProperty("/allowEdit", false);

            this.byId("cancelButton").setVisible(false);
            this.byId("saveButton").setVisible(false);
            this.byId("editButton").setVisible(true);
            if (oViewModel.getProperty("/allowPost") == true) {
                this.byId("postButton").setVisible(true);
            }
        },

        onBack: function (oEvent) {
            const oRouter = this.getOwnerComponent().getRouter();
            this.onExit();
            // const oViewModel = this.getView().getModel("oViewModel");
            // oViewModel.loadData(null);
            const oDetailPage = this.getView().byId("detailPage");
            if (oDetailPage) {
                oDetailPage.destroyContent();
            }
            oRouter.navTo("main", {}, true);
        },

        _buildChangeModel: async function (oDataItems) {

            let aRowModel = {};
            for (let taskData of oDataItems) {
                // start build json model for rows
                if (taskData.steus == "INT1") continue;
                const aItemVals = this._oChecklistData.to_Item.results.filter(function (el) {
                    return el.aufpl == taskData.aufpl && el.aplzl == taskData.aplzl;
                });

                let oRowObject = {
                    IsActiveEntity: aItemVals[0].IsActiveEntity == undefined ? "" : aItemVals[0].IsActiveEntity,
                    category: taskData.category,
                    aufpl: taskData.aufpl,
                    aplzl: taskData.aplzl,
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
                        let oVal = aItemVals.find(function (el) {
                            return el.keyname == cellKey;
                        });
                        oRowObject.values[cellKey] = {
                            sval: oVal == undefined ? "" : oVal.atwrt,
                            chitid: oVal.chitid,
                            itemno: oVal.itemno
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
                                        chitid: oVal.chitid,
                                        itemno: oVal.itemno
                                    };
                                    // oRowObject.values[elPoint] = oVal == undefined ? "" : oVal.atwrt;
                                    // oRowObject.values.chitid = oVal.chitid;
                                    // oRowObject.values.itemno = oVal.itemno;
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
                                chitid: oVal.chitid,
                                itemno: oVal.itemno
                            };
                            // oRowObject.values[cellKey] = oVal == undefined ? "" : oVal.atwrt;
                            // oRowObject.values.chitid = oVal.chitid;
                            // oRowObject.values.itemno = oVal.itemno;
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
        },

        // function change Checklist
        _changeChecklist: function () {
            var oTmpModel = this.getView().getModel();  //ZPM_CHECKLIST001_SRV
            oTmpModel.setDefaultBindingMode(sap.ui.model.BindingMode.TwoWay);
            oTmpModel.setUseBatch(true);
            oTmpModel.setDeferredGroups(["updateChecklist"]);

            const oChecklistModel = this.getView().getModel("oChecklistModel").getData();  // JSON model
            if (validator.dateIsFuture(oChecklistModel.gstri)) {
                sap.m.MessageBox.error("Actual Start tidak boleh di masa datang");
                return;
            }
            if (validator.dateIsFuture(oChecklistModel.gltri)) {
                sap.m.MessageBox.error("Actual Finish tidak boleh di masa datang");
                return;
            }
            if (validator.startDateIsLater(oChecklistModel.gstri, oChecklistModel.gltri)) {
                sap.m.MessageBox.error("Actual Start tidak boleh setelah Actual Finish");
                return;
            }

            const sHeader = "/ZC_PMChecklistHeader";
            const oKey = {
                "chkid": oChecklistModel.chkid,
                "IsActiveEntity": oChecklistModel.IsActiveEntity
            };
            const sHeaderPath = oTmpModel.createKey(sHeader, oKey);                         // OData model

            let iCount = 0;
            const oChangedChecklist = {
                chkty: oChecklistModel.chkty,
                cstat: oChecklistModel.cstat,
                gstri: oChecklistModel.gstri,
                gltri: oChecklistModel.gltri,
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

            for (let rowModel of this._aRowModels) {
                const sRowModelName = rowModel.aufpl + "_" + rowModel.aplzl;
                const oRowModel = this.getView().getModel(sRowModelName);
                const oRowData = oRowModel.getData();

                for (let row in oRowData.values) {
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

            for (let oPartner of oChecklistModel.to_Partner.results) {
                if (oPartner.bp_name) {
                    let itemNumber = 0;
                    const oChangedPartner = {
                        aufnr: oPartner.aufnr,
                        itemno: oPartner.itemno,
                        bp_id: oPartner.bp_id,
                        bp_name: oPartner.bp_name,
                        bp_func: oPartner.bp_func,
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

            for (let oApprover of oChecklistModel.to_Approver.results) {
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

            for (let oAttachment of oChecklistModel.to_Attachment.results) {
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

            BusyIndicator.show(10);
            oTmpModel.submitChanges({
                // groupId: "updateChecklist",
                success: function (oData, resp) {
                    BusyIndicator.hide()
                    sap.m.MessageToast.show("Checklist updated successfully!");
                },
                error: function (oError) {
                    console.error(oError);
                    BusyIndicator.hide()
                    sap.m.MessageBox.error("Error updating checklist.");
                }
            });
        },

        callPostChecklist: async function () {
            BusyIndicator.show();
            const sPdf = await this._createPdf();
            if (sPdf == undefined) {
                BusyIndicator.hide()
                sap.m.MessageBox.error("Generate PDF failed.");
                return;
            }
            const oModel = this.getView().getModel();
            oModel.setUseBatch(false);

            const oChecklistModel = this.getView().getModel("oChecklistModel");  // JSON model
            oChecklistModel.setProperty("/to_Attachment/results/2/att_url", btoa(sPdf));
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
            BusyIndicator.show();
            // let sResult;
            // try {
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
            // sResult = "S";

            // } catch (error) {
            // console.error(error);
            // }

            // if (sResult != "S") {
            //     BusyIndicator.hide();
            //     sap.m.MessageBox.error("Generate PDF failed.");
            //     return;
            // }

            oModel.callFunction("/ZC_PMChecklistHeaderApprove_post", {
                method: "POST",
                urlParameters: {
                    chkid: this._oChecklistData.chkid,
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

        _createPdf: async function () {
            let oViewModel = this.getView().getModel("oViewModel");
            let sAufnr = oViewModel.getProperty("/aufnr");
            let oNow = new Date();
            let oMonth = oNow.getMonth() + 1;
            let sFilename = sAufnr + "_" + oNow.getFullYear() + oMonth + oNow.getDate() + "_checksheet.pdf";
            const oOptions = {
                margin: [0.3, 0, 0.5, 0],
                filename: sFilename,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2 },
                jsPDF: { unit: 'in', format: 'letter', orientation: 'p' },
                pagebreak: { mode: ["avoid-all", "css"] } //{ avoid: 'img' }
            };

            const oElement = sap.ui.getCore().byId("checklistContainer");
            const printElement = oElement.getDomRef();
            // html2pdf().set(oOptions).from(printElement).save();
            // return html2pdf().set(oOptions).from(printElement).output("datauristring");
            return html2pdf().set(oOptions).from(printElement).outputPdf();
        }
    });
});