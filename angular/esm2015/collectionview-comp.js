import { ChangeDetectionStrategy, Component, ContentChild, Directive, ElementRef, EventEmitter, Host, Inject, Input, IterableDiffers, Output, TemplateRef, ViewChild, ViewContainerRef, ɵisListLikeIterable as isListLikeIterable, } from '@angular/core';
import { LayoutBase, ObservableArray, Trace } from '@nativescript/core';
import { CLog, CLogTypes, CollectionView, ListViewViewTypes } from '@nativescript-community/ui-collectionview';
import { getSingleViewRecursive, registerElement } from '@nativescript/angular';
import * as i0 from "@angular/core";
const _c0 = ["loader"];
registerElement('CollectionView', () => CollectionView);
const NG_VIEW = '_ngViewRef';
export class ItemContext {
    constructor($implicit, item, index, even, odd) {
        this.$implicit = $implicit;
        this.item = item;
        this.index = index;
        this.even = even;
        this.odd = odd;
    }
}
export class CollectionViewComponent {
    constructor(_elementRef, _iterableDiffers) {
        this._iterableDiffers = _iterableDiffers;
        this.setupItemView = new EventEmitter();
        this.itemViewLoader = (viewType) => {
            switch (viewType) {
                case ListViewViewTypes.ItemView:
                    if (this._itemTemplate && this.loader) {
                        const nativeItem = this.loader.createEmbeddedView(this._itemTemplate, new ItemContext(), 0);
                        const typedView = getItemViewRoot(nativeItem);
                        typedView[NG_VIEW] = nativeItem;
                        return typedView;
                    }
                    break;
            }
            return null;
        };
        this._collectionView = _elementRef.nativeElement;
        this._collectionView.on(CollectionView.itemLoadingEvent, this.onItemLoading, this);
        this._collectionView.itemViewLoader = this.itemViewLoader;
    }
    get nativeElement() {
        return this._collectionView;
    }
    get listView() {
        return this._collectionView;
    }
    get itemTemplate() {
        return this._itemTemplate;
    }
    set itemTemplate(value) {
        this._itemTemplate = value;
        this._collectionView.refresh();
    }
    get items() {
        return this._items;
    }
    set items(value) {
        this._items = value;
        let needDiffer = true;
        if (value instanceof ObservableArray) {
            needDiffer = false;
        }
        if (needDiffer && !this._differ && isListLikeIterable(value)) {
            this._differ = this._iterableDiffers.find(this._items).create((_index, item) => item);
        }
        this._collectionView.items = this._items;
    }
    ngAfterContentInit() {
        if (Trace.isEnabled()) {
            CLog(CLogTypes.info, 'CollectionView.ngAfterContentInit()');
        }
        this.setItemTemplates();
    }
    ngOnDestroy() {
        this._collectionView.off(CollectionView.itemLoadingEvent, this.onItemLoading, this);
    }
    ngDoCheck() {
        if (Trace.isEnabled()) {
            CLog(CLogTypes.info, 'ngDoCheck() - execute differ? ' + this._differ);
        }
        if (this._differ) {
            if (Trace.isEnabled()) {
                CLog(CLogTypes.info, 'ngDoCheck() - execute differ');
            }
            const changes = this._differ.diff(this._items);
            if (changes) {
                if (Trace.isEnabled()) {
                    CLog(CLogTypes.info, 'ngDoCheck() - refresh');
                }
                this.refresh();
            }
        }
    }
    registerTemplate(key, template) {
        if (Trace.isEnabled()) {
            CLog(CLogTypes.info, 'registerTemplate for key: ' + key);
        }
        if (!this._templateMap) {
            this._templateMap = new Map();
        }
        const keyedTemplate = {
            key,
            createView: this.getItemTemplateViewFactory(template),
        };
        this._templateMap.set(key, keyedTemplate);
    }
    onItemLoading(args) {
        if (!args.view && !this.itemTemplate) {
            return;
        }
        if (!this.items)
            return;
        const index = args.index;
        const items = args.object.items;
        const currentItem = typeof items.getItem === 'function'
            ? items.getItem(index)
            : items[index];
        let viewRef;
        if (Trace.isEnabled()) {
            CLog(CLogTypes.info, `onItemLoading: ${index} - Reusing existing view`);
        }
        viewRef = args.view[NG_VIEW];
        if (!viewRef &&
            args.view instanceof LayoutBase &&
            args.view.getChildrenCount() > 0) {
            viewRef = args.view.getChildAt(0)[NG_VIEW];
        }
        if (!viewRef && Trace.isEnabled()) {
            if (Trace.isEnabled()) {
                CLog(CLogTypes.info, `ViewReference not found for item ${index}. View recycling is not working`);
            }
        }
        if (!viewRef) {
            if (Trace.isEnabled()) {
                CLog(CLogTypes.info, `onItemLoading: ${index} - Creating view from template`);
            }
            viewRef = this.loader.createEmbeddedView(this.itemTemplate, new ItemContext(), 0);
            args.view = getItemViewRoot(viewRef);
            args.view[NG_VIEW] = viewRef;
        }
        this.setupViewRef(viewRef, currentItem, index);
        this.detectChangesOnChild(viewRef, index);
    }
    setupViewRef(view, data, index) {
        const context = view.context;
        context.$implicit = data;
        context.item = data;
        context.index = index;
        context.even = index % 2 === 0;
        context.odd = !context.even;
        this.setupItemView.next({
            context,
            data,
            index,
            view,
        });
    }
    getItemTemplateViewFactory(template) {
        return () => {
            const viewRef = this.loader.createEmbeddedView(template, new ItemContext(), 0);
            const resultView = getItemViewRoot(viewRef);
            resultView[NG_VIEW] = viewRef;
            return resultView;
        };
    }
    setItemTemplates() {
        this.itemTemplate = this.itemTemplateQuery;
        if (this._templateMap) {
            if (Trace.isEnabled()) {
                CLog(CLogTypes.info, 'Setting templates');
            }
            const templates = [];
            this._templateMap.forEach((value) => {
                templates.push(value);
            });
            this._collectionView.itemTemplates = templates;
        }
        else {
            this._collectionView.itemTemplate = this.getItemTemplateViewFactory(this.itemTemplate);
        }
    }
    detectChangesOnChild(viewRef, index) {
        if (Trace.isEnabled()) {
            CLog(CLogTypes.info, 'Manually detect changes in child: ' + index);
        }
        viewRef.markForCheck();
        viewRef.detectChanges();
    }
    refresh() {
        if (this._collectionView) {
            this._collectionView.refresh();
        }
    }
}
CollectionViewComponent.ɵfac = function CollectionViewComponent_Factory(t) { return new (t || CollectionViewComponent)(i0.ɵɵdirectiveInject(ElementRef), i0.ɵɵdirectiveInject(IterableDiffers)); };
CollectionViewComponent.ɵcmp = i0.ɵɵdefineComponent({ type: CollectionViewComponent, selectors: [["CollectionView"]], contentQueries: function CollectionViewComponent_ContentQueries(rf, ctx, dirIndex) { if (rf & 1) {
        i0.ɵɵcontentQuery(dirIndex, TemplateRef, 3, TemplateRef);
    } if (rf & 2) {
        let _t;
        i0.ɵɵqueryRefresh(_t = i0.ɵɵloadQuery()) && (ctx.itemTemplateQuery = _t.first);
    } }, viewQuery: function CollectionViewComponent_Query(rf, ctx) { if (rf & 1) {
        i0.ɵɵviewQuery(_c0, 3, ViewContainerRef);
    } if (rf & 2) {
        let _t;
        i0.ɵɵqueryRefresh(_t = i0.ɵɵloadQuery()) && (ctx.loader = _t.first);
    } }, inputs: { itemTemplate: "itemTemplate", items: "items" }, outputs: { setupItemView: "setupItemView" }, decls: 3, vars: 0, consts: [["loader", ""]], template: function CollectionViewComponent_Template(rf, ctx) { if (rf & 1) {
        i0.ɵɵelementStart(0, "DetachedContainer");
        i0.ɵɵelement(1, "Placeholder", null, 0);
        i0.ɵɵelementEnd();
    } }, encapsulation: 2, changeDetection: 0 });
(function () { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(CollectionViewComponent, [{
        type: Component,
        args: [{
                selector: 'CollectionView',
                template: `
        <DetachedContainer>
            <Placeholder #loader></Placeholder>
        </DetachedContainer>
    `,
                changeDetection: ChangeDetectionStrategy.OnPush,
            }]
    }], function () { return [{ type: i0.ElementRef, decorators: [{
                type: Inject,
                args: [ElementRef]
            }] }, { type: i0.IterableDiffers, decorators: [{
                type: Inject,
                args: [IterableDiffers]
            }] }]; }, { loader: [{
            type: ViewChild,
            args: ['loader', { read: ViewContainerRef, static: true }]
        }], setupItemView: [{
            type: Output
        }], itemTemplateQuery: [{
            type: ContentChild,
            args: [TemplateRef, { read: TemplateRef, static: true }]
        }], itemTemplate: [{
            type: Input
        }], items: [{
            type: Input
        }] }); })();
export function getItemViewRoot(viewRef, rootLocator = getSingleViewRecursive) {
    const rootView = rootLocator(viewRef.rootNodes, 0);
    return rootView;
}
export class TemplateKeyDirective {
    constructor(templateRef, collectionView) {
        this.templateRef = templateRef;
        this.collectionView = collectionView;
    }
    set cvTemplateKey(value) {
        if (Trace.isEnabled()) {
            CLog(CLogTypes.info, 'cvTemplateKey: ' + value);
        }
        if (this.collectionView && this.templateRef) {
            this.collectionView.registerTemplate(value.toLowerCase(), this.templateRef);
        }
    }
}
TemplateKeyDirective.ɵfac = function TemplateKeyDirective_Factory(t) { return new (t || TemplateKeyDirective)(i0.ɵɵdirectiveInject(i0.TemplateRef), i0.ɵɵdirectiveInject(CollectionViewComponent, 1)); };
TemplateKeyDirective.ɵdir = i0.ɵɵdefineDirective({ type: TemplateKeyDirective, selectors: [["", "cvTemplateKey", ""]], inputs: { cvTemplateKey: "cvTemplateKey" } });
(function () { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(TemplateKeyDirective, [{
        type: Directive,
        args: [{ selector: '[cvTemplateKey]' }]
    }], function () { return [{ type: i0.TemplateRef }, { type: CollectionViewComponent, decorators: [{
                type: Host
            }] }]; }, { cvTemplateKey: [{
            type: Input
        }] }); })();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29sbGVjdGlvbnZpZXctY29tcC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb2xsZWN0aW9udmlldy9hbmd1bGFyL2NvbGxlY3Rpb252aWV3LWNvbXAudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUVILHVCQUF1QixFQUN2QixTQUFTLEVBQ1QsWUFBWSxFQUNaLFNBQVMsRUFFVCxVQUFVLEVBRVYsWUFBWSxFQUNaLElBQUksRUFDSixNQUFNLEVBQ04sS0FBSyxFQUVMLGVBQWUsRUFFZixNQUFNLEVBQ04sV0FBVyxFQUNYLFNBQVMsRUFDVCxnQkFBZ0IsRUFDaEIsbUJBQW1CLElBQUksa0JBQWtCLEdBQzVDLE1BQU0sZUFBZSxDQUFDO0FBQ3ZCLE9BQU8sRUFBaUIsVUFBVSxFQUFFLGVBQWUsRUFBRSxLQUFLLEVBQVEsTUFBTSxvQkFBb0IsQ0FBQztBQUM3RixPQUFPLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxjQUFjLEVBQStCLGlCQUFpQixFQUFFLE1BQU0sMkNBQTJDLENBQUM7QUFFNUksT0FBTyxFQUFFLHNCQUFzQixFQUFlLGVBQWUsRUFBRSxNQUFNLHVCQUF1QixDQUFDOzs7QUFFN0YsZUFBZSxDQUFDLGdCQUFnQixFQUFFLEdBQUcsRUFBRSxDQUFDLGNBQWMsQ0FBQyxDQUFDO0FBRXhELE1BQU0sT0FBTyxHQUFHLFlBQVksQ0FBQztBQUU3QixNQUFNLE9BQU8sV0FBVztJQUNwQixZQUNXLFNBQWUsRUFDZixJQUFVLEVBQ1YsS0FBYyxFQUNkLElBQWMsRUFDZCxHQUFhO1FBSmIsY0FBUyxHQUFULFNBQVMsQ0FBTTtRQUNmLFNBQUksR0FBSixJQUFJLENBQU07UUFDVixVQUFLLEdBQUwsS0FBSyxDQUFTO1FBQ2QsU0FBSSxHQUFKLElBQUksQ0FBVTtRQUNkLFFBQUcsR0FBSCxHQUFHLENBQVU7SUFDckIsQ0FBQztDQUNQO0FBa0JELE1BQU0sT0FBTyx1QkFBdUI7SUEyQ2hDLFlBQWdD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QUFhLENBQUMsS0FBVTtRQUN4QixJQUFJLEtBQUssQ0FBQyxTQUFTLEVBQUUsRUFBRTtZQUNuQixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxpQkFBaUIsR0FBRyxLQUFLLENBQUMsQ0FBQztTQUNuRDtRQUNELElBQUksSUFBSSxDQUFDLGNBQWMsSUFBSSxJQUFJLENBQUMsV0FBVyxFQUFFO1lBQ3pDLElBQUksQ0FBQyxjQUFjLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxDQUFDLFdBQVcsRUFBRSxFQUFFLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztTQUMvRTtJQUNMLENBQUM7O3dGQVhRLG9CQUFvQiw2REFDc0QsdUJBQXVCO3lEQURqRyxvQkFBb0I7dUZBQXBCLG9CQUFvQjtjQURoQyxTQUFTO2VBQUMsRUFBRSxRQUFRLEVBQUUsaUJBQWlCLEVBQUU7Z0VBRTZDLHVCQUF1QjtzQkFBdEQsSUFBSTt3QkFHcEQsYUFBYTtrQkFEaEIsS0FBSyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7XG4gICAgQWZ0ZXJDb250ZW50SW5pdCxcbiAgICBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneSxcbiAgICBDb21wb25lbnQsXG4gICAgQ29udGVudENoaWxkLFxuICAgIERpcmVjdGl2ZSxcbiAgICBEb0NoZWNrLFxuICAgIEVsZW1lbnRSZWYsXG4gICAgRW1iZWRkZWRWaWV3UmVmLFxuICAgIEV2ZW50RW1pdHRlcixcbiAgICBIb3N0LFxuICAgIEluamVjdCxcbiAgICBJbnB1dCxcbiAgICBJdGVyYWJsZURpZmZlcixcbiAgICBJdGVyYWJsZURpZmZlcnMsXG4gICAgT25EZXN0cm95LFxuICAgIE91dHB1dCxcbiAgICBUZW1wbGF0ZVJlZixcbiAgICBWaWV3Q2hpbGQsXG4gICAgVmlld0NvbnRhaW5lclJlZixcbiAgICDJtWlzTGlzdExpa2VJdGVyYWJsZSBhcyBpc0xpc3RMaWtlSXRlcmFibGUsXG59IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHsgS2V5ZWRUZW1wbGF0ZSwgTGF5b3V0QmFzZSwgT2JzZXJ2YWJsZUFycmF5LCBUcmFjZSwgVmlldyB9IGZyb20gJ0BuYXRpdmVzY3JpcHQvY29yZSc7XG5pbXBvcnQgeyBDTG9nLCBDTG9nVHlwZXMsIENvbGxlY3Rpb25WaWV3LCBDb2xsZWN0aW9uVmlld0l0ZW1FdmVudERhdGEsIExpc3RWaWV3Vmlld1R5cGVzIH0gZnJvbSAnQG5hdGl2ZXNjcmlwdC1jb21tdW5pdHkvdWktY29sbGVjdGlvbnZpZXcnO1xuXG5pbXBvcnQgeyBnZXRTaW5nbGVWaWV3UmVjdXJzaXZlLCBpc0tub3duVmlldywgcmVnaXN0ZXJFbGVtZW50IH0gZnJvbSAnQG5hdGl2ZXNjcmlwdC9hbmd1bGFyJztcblxucmVnaXN0ZXJFbGVtZW50KCdDb2xsZWN0aW9uVmlldycsICgpID0+IENvbGxlY3Rpb25WaWV3KTtcblxuY29uc3QgTkdfVklFVyA9ICdfbmdWaWV3UmVmJztcblxuZXhwb3J0IGNsYXNzIEl0ZW1Db250ZXh0IHtcbiAgICBjb25zdHJ1Y3RvcihcbiAgICAgICAgcHVibGljICRpbXBsaWNpdD86IGFueSxcbiAgICAgICAgcHVibGljIGl0ZW0/OiBhbnksXG4gICAgICAgIHB1YmxpYyBpbmRleD86IG51bWJlcixcbiAgICAgICAgcHVibGljIGV2ZW4/OiBib29sZWFuLFxuICAgICAgICBwdWJsaWMgb2RkPzogYm9vbGVhblxuICAgICkge31cbn1cblxuZXhwb3J0IGludGVyZmFjZSBTZXR1cEl0ZW1WaWV3QXJncyB7XG4gICAgdmlldzogRW1iZWRkZWRWaWV3UmVmPGFueT47XG4gICAgZGF0YTogYW55O1xuICAgIGluZGV4OiBudW1iZXI7XG4gICAgY29udGV4dDogSXRlbUNvbnRleHQ7XG59XG5cbkBDb21wb25lbnQoe1xuICAgIHNlbGVjdG9yOiAnQ29sbGVjdGlvblZpZXcnLFxuICAgIHRlbXBsYXRlOiBgXG4gICAgICAgIDxEZXRhY2hlZENvbnRhaW5lcj5cbiAgICAgICAgICAgIDxQbGFjZWhvbGRlciAjbG9hZGVyPjwvUGxhY2Vob2xkZXI+XG4gICAgICAgIDwvRGV0YWNoZWRDb250YWluZXI+XG4gICAgYCxcbiAgICBjaGFuZ2VEZXRlY3Rpb246IENoYW5nZURldGVjdGlvblN0cmF0ZWd5Lk9uUHVzaCxcbn0pXG5leHBvcnQgY2xhc3MgQ29sbGVjdGlvblZpZXdDb21wb25lbnQgaW1wbGVtZW50cyBEb0NoZWNrLCBPbkRlc3Ryb3ksIEFmdGVyQ29udGVudEluaXQge1xuICAgIHB1YmxpYyBnZXQgbmF0aXZlRWxlbWVudCgpOiBhbnkge1xuICAgICAgICByZXR1cm4gdGhpcy5fY29sbGVjdGlvblZpZXc7XG4gICAgfVxuICAgIHB1YmxpYyBnZXQgbGlzdFZpZXcoKTogYW55IHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2NvbGxlY3Rpb25WaWV3O1xuICAgIH1cblxuICAgIEBWaWV3Q2hpbGQoJ2xvYWRlcicsIHsgcmVhZDogVmlld0NvbnRhaW5lclJlZiwgc3RhdGljOiB0cnVlIH0pIHB1YmxpYyBsb2FkZXI6IFZpZXdDb250YWluZXJSZWY7XG4gICAgQE91dHB1dCgpIHB1YmxpYyBzZXR1cEl0ZW1WaWV3ID0gbmV3IEV2ZW50RW1pdHRlcjxTZXR1cEl0ZW1WaWV3QXJncz4oKTtcbiAgICBAQ29udGVudENoaWxkKFRlbXBsYXRlUmVmLCB7IHJlYWQ6IFRlbXBsYXRlUmVmLCBzdGF0aWM6IHRydWUgfSkgcHVibGljIGl0ZW1UZW1wbGF0ZVF1ZXJ5OiBUZW1wbGF0ZVJlZjxJdGVtQ29udGV4dD47XG5cbiAgICBASW5wdXQoKVxuICAgIHB1YmxpYyBnZXQgaXRlbVRlbXBsYXRlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5faXRlbVRlbXBsYXRlO1xuICAgIH1cbiAgICBwdWJsaWMgc2V0IGl0ZW1UZW1wbGF0ZSh2YWx1ZTogYW55KSB7XG4gICAgICAgIHRoaXMuX2l0ZW1UZW1wbGF0ZSA9IHZhbHVlO1xuICAgICAgICB0aGlzLl9jb2xsZWN0aW9uVmlldy5yZWZyZXNoKCk7XG4gICAgfVxuICAgIEBJbnB1dCgpXG4gICAgcHVibGljIGdldCBpdGVtcygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2l0ZW1zO1xuICAgIH1cbiAgICBwdWJsaWMgc2V0IGl0ZW1zKHZhbHVlOiBhbnkpIHtcbiAgICAgICAgdGhpcy5faXRlbXMgPSB2YWx1ZTtcbiAgICAgICAgbGV0IG5lZWREaWZmZXIgPSB0cnVlO1xuICAgICAgICBpZiAodmFsdWUgaW5zdGFuY2VvZiBPYnNlcnZhYmxlQXJyYXkpIHtcbiAgICAgICAgICAgIG5lZWREaWZmZXIgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAobmVlZERpZmZlciAmJiAhdGhpcy5fZGlmZmVyICYmIGlzTGlzdExpa2VJdGVyYWJsZSh2YWx1ZSkpIHtcbiAgICAgICAgICAgIHRoaXMuX2RpZmZlciA9IHRoaXMuX2l0ZXJhYmxlRGlmZmVycy5maW5kKHRoaXMuX2l0ZW1zKS5jcmVhdGUoKF9pbmRleCwgaXRlbSkgPT4gaXRlbSk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9jb2xsZWN0aW9uVmlldy5pdGVtcyA9IHRoaXMuX2l0ZW1zO1xuICAgIH1cblxuICAgIHByaXZhdGUgX2NvbGxlY3Rpb25WaWV3OiBDb2xsZWN0aW9uVmlldztcbiAgICBwcml2YXRlIF9pdGVtczogYW55O1xuICAgIHByaXZhdGUgX2RpZmZlcjogSXRlcmFibGVEaWZmZXI8S2V5ZWRUZW1wbGF0ZT47XG4gICAgcHJpdmF0ZSBfaXRlbVRlbXBsYXRlOiBUZW1wbGF0ZVJlZjxJdGVtQ29udGV4dD47XG4gICAgcHJpdmF0ZSBfdGVtcGxhdGVNYXA6IE1hcDxzdHJpbmcsIEtleWVkVGVtcGxhdGU+O1xuXG4gICAgY29uc3RydWN0b3IoQEluamVjdChFbGVtZW50UmVmKSBfZWxlbWVudFJlZjogRWxlbWVudFJlZiwgQEluamVjdChJdGVyYWJsZURpZmZlcnMpIHByaXZhdGUgX2l0ZXJhYmxlRGlmZmVyczogSXRlcmFibGVEaWZmZXJzKSB7XG4gICAgICAgIHRoaXMuX2NvbGxlY3Rpb25WaWV3ID0gX2VsZW1lbnRSZWYubmF0aXZlRWxlbWVudDtcblxuICAgICAgICB0aGlzLl9jb2xsZWN0aW9uVmlldy5vbihDb2xsZWN0aW9uVmlldy5pdGVtTG9hZGluZ0V2ZW50LCB0aGlzLm9uSXRlbUxvYWRpbmcsIHRoaXMpO1xuICAgICAgICB0aGlzLl9jb2xsZWN0aW9uVmlldy5pdGVtVmlld0xvYWRlciA9IHRoaXMuaXRlbVZpZXdMb2FkZXI7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBpdGVtVmlld0xvYWRlciA9ICh2aWV3VHlwZSkgPT4ge1xuICAgICAgICBzd2l0Y2ggKHZpZXdUeXBlKSB7XG4gICAgICAgICAgICBjYXNlIExpc3RWaWV3Vmlld1R5cGVzLkl0ZW1WaWV3OlxuICAgICAgICAgICAgICAgIGlmICh0aGlzLl9pdGVtVGVtcGxhdGUgJiYgdGhpcy5sb2FkZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbmF0aXZlSXRlbSA9IHRoaXMubG9hZGVyLmNyZWF0ZUVtYmVkZGVkVmlldyh0aGlzLl9pdGVtVGVtcGxhdGUsIG5ldyBJdGVtQ29udGV4dCgpLCAwKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdHlwZWRWaWV3ID0gZ2V0SXRlbVZpZXdSb290KG5hdGl2ZUl0ZW0pO1xuICAgICAgICAgICAgICAgICAgICB0eXBlZFZpZXdbTkdfVklFV10gPSBuYXRpdmVJdGVtO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHlwZWRWaWV3O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9O1xuXG4gICAgcHVibGljIG5nQWZ0ZXJDb250ZW50SW5pdCgpIHtcbiAgICAgICAgaWYgKFRyYWNlLmlzRW5hYmxlZCgpKSB7XG4gICAgICAgICAgICBDTG9nKENMb2dUeXBlcy5pbmZvLCAnQ29sbGVjdGlvblZpZXcubmdBZnRlckNvbnRlbnRJbml0KCknKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnNldEl0ZW1UZW1wbGF0ZXMoKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgbmdPbkRlc3Ryb3koKSB7XG4gICAgICAgIHRoaXMuX2NvbGxlY3Rpb25WaWV3Lm9mZihDb2xsZWN0aW9uVmlldy5pdGVtTG9hZGluZ0V2ZW50LCB0aGlzLm9uSXRlbUxvYWRpbmcsIHRoaXMpO1xuICAgIH1cblxuICAgIHB1YmxpYyBuZ0RvQ2hlY2soKSB7XG4gICAgICAgIGlmIChUcmFjZS5pc0VuYWJsZWQoKSkge1xuICAgICAgICAgICAgQ0xvZyhDTG9nVHlwZXMuaW5mbywgJ25nRG9DaGVjaygpIC0gZXhlY3V0ZSBkaWZmZXI/ICcgKyB0aGlzLl9kaWZmZXIpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLl9kaWZmZXIpIHtcbiAgICAgICAgICAgIGlmIChUcmFjZS5pc0VuYWJsZWQoKSkge1xuICAgICAgICAgICAgICAgIENMb2coQ0xvZ1R5cGVzLmluZm8sICduZ0RvQ2hlY2soKSAtIGV4ZWN1dGUgZGlmZmVyJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBjaGFuZ2VzID0gdGhpcy5fZGlmZmVyLmRpZmYodGhpcy5faXRlbXMpO1xuICAgICAgICAgICAgaWYgKGNoYW5nZXMpIHtcbiAgICAgICAgICAgICAgICBpZiAoVHJhY2UuaXNFbmFibGVkKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgQ0xvZyhDTG9nVHlwZXMuaW5mbywgJ25nRG9DaGVjaygpIC0gcmVmcmVzaCcpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLnJlZnJlc2goKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHB1YmxpYyByZWdpc3RlclRlbXBsYXRlKGtleTogc3RyaW5nLCB0ZW1wbGF0ZTogVGVtcGxhdGVSZWY8SXRlbUNvbnRleHQ+KSB7XG4gICAgICAgIGlmIChUcmFjZS5pc0VuYWJsZWQoKSkge1xuICAgICAgICAgICAgQ0xvZyhDTG9nVHlwZXMuaW5mbywgJ3JlZ2lzdGVyVGVtcGxhdGUgZm9yIGtleTogJyArIGtleSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCF0aGlzLl90ZW1wbGF0ZU1hcCkge1xuICAgICAgICAgICAgdGhpcy5fdGVtcGxhdGVNYXAgPSBuZXcgTWFwPHN0cmluZywgS2V5ZWRUZW1wbGF0ZT4oKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGtleWVkVGVtcGxhdGUgPSB7XG4gICAgICAgICAgICBrZXksXG4gICAgICAgICAgICBjcmVhdGVWaWV3OiB0aGlzLmdldEl0ZW1UZW1wbGF0ZVZpZXdGYWN0b3J5KHRlbXBsYXRlKSxcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLl90ZW1wbGF0ZU1hcC5zZXQoa2V5LCBrZXllZFRlbXBsYXRlKTtcbiAgICB9XG5cbiAgICAvLyBASG9zdExpc3RlbmVyKCdpdGVtTG9hZGluZ0ludGVybmFsJywgWyckZXZlbnQnXSlcbiAgICBwdWJsaWMgb25JdGVtTG9hZGluZyhhcmdzOiBDb2xsZWN0aW9uVmlld0l0ZW1FdmVudERhdGEpIHtcbiAgICAgICAgaWYgKCFhcmdzLnZpZXcgJiYgIXRoaXMuaXRlbVRlbXBsYXRlKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCF0aGlzLml0ZW1zKSByZXR1cm47XG4gICAgICAgIGNvbnN0IGluZGV4ID0gYXJncy5pbmRleDtcbiAgICAgICAgY29uc3QgaXRlbXMgPSAoYXJncy5vYmplY3QgYXMgYW55KS5pdGVtcztcbiAgICAgICAgY29uc3QgY3VycmVudEl0ZW0gPVxuICAgICAgICAgICAgdHlwZW9mIGl0ZW1zLmdldEl0ZW0gPT09ICdmdW5jdGlvbidcbiAgICAgICAgICAgICAgICA/IGl0ZW1zLmdldEl0ZW0oaW5kZXgpXG4gICAgICAgICAgICAgICAgOiBpdGVtc1tpbmRleF07XG4gICAgICAgIGxldCB2aWV3UmVmOiBFbWJlZGRlZFZpZXdSZWY8SXRlbUNvbnRleHQ+O1xuXG4gICAgICAgIGlmIChUcmFjZS5pc0VuYWJsZWQoKSkge1xuICAgICAgICAgICAgQ0xvZyhDTG9nVHlwZXMuaW5mbywgYG9uSXRlbUxvYWRpbmc6ICR7aW5kZXh9IC0gUmV1c2luZyBleGlzdGluZyB2aWV3YCk7XG4gICAgICAgIH1cblxuICAgICAgICB2aWV3UmVmID0gYXJncy52aWV3W05HX1ZJRVddO1xuICAgICAgICAvLyBHZXR0aW5nIGFuZ3VsYXIgdmlldyBmcm9tIG9yaWdpbmFsIGVsZW1lbnQgKGluIGNhc2VzIHdoZW4gUHJveHlWaWV3Q29udGFpbmVyXG4gICAgICAgIC8vIGlzIHVzZWQgTmF0aXZlU2NyaXB0IGludGVybmFsbHkgd3JhcHMgaXQgaW4gYSBTdGFja0xheW91dClcbiAgICAgICAgaWYgKFxuICAgICAgICAgICAgIXZpZXdSZWYgJiZcbiAgICAgICAgICAgIGFyZ3MudmlldyBpbnN0YW5jZW9mIExheW91dEJhc2UgJiZcbiAgICAgICAgICAgIGFyZ3Mudmlldy5nZXRDaGlsZHJlbkNvdW50KCkgPiAwXG4gICAgICAgICkge1xuICAgICAgICAgICAgdmlld1JlZiA9IGFyZ3Mudmlldy5nZXRDaGlsZEF0KDApW05HX1ZJRVddO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCF2aWV3UmVmICYmIFRyYWNlLmlzRW5hYmxlZCgpKSB7XG4gICAgICAgICAgICBpZiAoVHJhY2UuaXNFbmFibGVkKCkpIHtcbiAgICAgICAgICAgICAgICBDTG9nKENMb2dUeXBlcy5pbmZvLCBgVmlld1JlZmVyZW5jZSBub3QgZm91bmQgZm9yIGl0ZW0gJHtpbmRleH0uIFZpZXcgcmVjeWNsaW5nIGlzIG5vdCB3b3JraW5nYCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXZpZXdSZWYpIHtcbiAgICAgICAgICAgIGlmIChUcmFjZS5pc0VuYWJsZWQoKSkge1xuICAgICAgICAgICAgICAgIENMb2coQ0xvZ1R5cGVzLmluZm8sIGBvbkl0ZW1Mb2FkaW5nOiAke2luZGV4fSAtIENyZWF0aW5nIHZpZXcgZnJvbSB0ZW1wbGF0ZWApO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2aWV3UmVmID0gdGhpcy5sb2FkZXIuY3JlYXRlRW1iZWRkZWRWaWV3KFxuICAgICAgICAgICAgICAgIHRoaXMuaXRlbVRlbXBsYXRlLFxuICAgICAgICAgICAgICAgIG5ldyBJdGVtQ29udGV4dCgpLFxuICAgICAgICAgICAgICAgIDBcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICBhcmdzLnZpZXcgPSBnZXRJdGVtVmlld1Jvb3Qodmlld1JlZik7XG4gICAgICAgICAgICBhcmdzLnZpZXdbTkdfVklFV10gPSB2aWV3UmVmO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5zZXR1cFZpZXdSZWYodmlld1JlZiwgY3VycmVudEl0ZW0sIGluZGV4KTtcblxuICAgICAgICB0aGlzLmRldGVjdENoYW5nZXNPbkNoaWxkKHZpZXdSZWYsIGluZGV4KTtcbiAgICB9XG5cbiAgICBwdWJsaWMgc2V0dXBWaWV3UmVmKHZpZXc6IEVtYmVkZGVkVmlld1JlZjxJdGVtQ29udGV4dD4sIGRhdGE6IGFueSwgaW5kZXg6IG51bWJlcik6IHZvaWQge1xuICAgICAgICBjb25zdCBjb250ZXh0ID0gdmlldy5jb250ZXh0O1xuICAgICAgICBjb250ZXh0LiRpbXBsaWNpdCA9IGRhdGE7XG4gICAgICAgIGNvbnRleHQuaXRlbSA9IGRhdGE7XG4gICAgICAgIGNvbnRleHQuaW5kZXggPSBpbmRleDtcbiAgICAgICAgY29udGV4dC5ldmVuID0gaW5kZXggJSAyID09PSAwO1xuICAgICAgICBjb250ZXh0Lm9kZCA9ICFjb250ZXh0LmV2ZW47XG5cbiAgICAgICAgdGhpcy5zZXR1cEl0ZW1WaWV3Lm5leHQoe1xuICAgICAgICAgICAgY29udGV4dCxcbiAgICAgICAgICAgIGRhdGEsXG4gICAgICAgICAgICBpbmRleCxcbiAgICAgICAgICAgIHZpZXcsXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHByb3RlY3RlZCBnZXRJdGVtVGVtcGxhdGVWaWV3RmFjdG9yeShcbiAgICAgICAgdGVtcGxhdGU6IFRlbXBsYXRlUmVmPEl0ZW1Db250ZXh0PlxuICAgICk6ICgpID0+IFZpZXcge1xuICAgICAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgICAgICAgY29uc3Qgdmlld1JlZiA9IHRoaXMubG9hZGVyLmNyZWF0ZUVtYmVkZGVkVmlldyhcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZSxcbiAgICAgICAgICAgICAgICBuZXcgSXRlbUNvbnRleHQoKSxcbiAgICAgICAgICAgICAgICAwXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgY29uc3QgcmVzdWx0VmlldyA9IGdldEl0ZW1WaWV3Um9vdCh2aWV3UmVmKTtcbiAgICAgICAgICAgIHJlc3VsdFZpZXdbTkdfVklFV10gPSB2aWV3UmVmO1xuXG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0VmlldztcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBwcml2YXRlIHNldEl0ZW1UZW1wbGF0ZXMoKSB7XG4gICAgICAgIC8vIFRoZSBpdGVtVGVtcGxhdGVRdWVyeSBtYXkgYmUgY2hhbmdlZCBhZnRlciBsaXN0IGl0ZW1zIGFyZSBhZGRlZCB0aGF0IGNvbnRhaW4gPHRlbXBsYXRlPiBpbnNpZGUsXG4gICAgICAgIC8vIHNvIGNhY2hlIGFuZCB1c2Ugb25seSB0aGUgb3JpZ2luYWwgdGVtcGxhdGUgdG8gYXZvaWQgZXJyb3JzLlxuICAgICAgICB0aGlzLml0ZW1UZW1wbGF0ZSA9IHRoaXMuaXRlbVRlbXBsYXRlUXVlcnk7XG5cbiAgICAgICAgaWYgKHRoaXMuX3RlbXBsYXRlTWFwKSB7XG4gICAgICAgICAgICBpZiAoVHJhY2UuaXNFbmFibGVkKCkpIHtcbiAgICAgICAgICAgICAgICBDTG9nKENMb2dUeXBlcy5pbmZvLCAnU2V0dGluZyB0ZW1wbGF0ZXMnKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgdGVtcGxhdGVzOiBLZXllZFRlbXBsYXRlW10gPSBbXTtcbiAgICAgICAgICAgIHRoaXMuX3RlbXBsYXRlTWFwLmZvckVhY2goKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgICAgdGVtcGxhdGVzLnB1c2godmFsdWUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB0aGlzLl9jb2xsZWN0aW9uVmlldy5pdGVtVGVtcGxhdGVzID0gdGVtcGxhdGVzO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gSWYgdGhlIG1hcCB3YXMgbm90IGluaXRpYWxpemVkIHRoaXMgbWVhbnMgdGhhdCB0aGVyZSBhcmUgbm8gbmFtZWQgdGVtcGxhdGVzLCBzbyB3ZSByZWdpc3RlciB0aGUgZGVmYXVsdCBvbmUuXG4gICAgICAgICAgICB0aGlzLl9jb2xsZWN0aW9uVmlldy5pdGVtVGVtcGxhdGUgPSB0aGlzLmdldEl0ZW1UZW1wbGF0ZVZpZXdGYWN0b3J5KHRoaXMuaXRlbVRlbXBsYXRlKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgZGV0ZWN0Q2hhbmdlc09uQ2hpbGQodmlld1JlZjogRW1iZWRkZWRWaWV3UmVmPEl0ZW1Db250ZXh0PiwgaW5kZXg6IG51bWJlcikge1xuICAgICAgICBpZiAoVHJhY2UuaXNFbmFibGVkKCkpIHtcbiAgICAgICAgICAgIENMb2coQ0xvZ1R5cGVzLmluZm8sICdNYW51YWxseSBkZXRlY3QgY2hhbmdlcyBpbiBjaGlsZDogJyArIGluZGV4KTtcbiAgICAgICAgfVxuICAgICAgICB2aWV3UmVmLm1hcmtGb3JDaGVjaygpO1xuICAgICAgICB2aWV3UmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIHJlZnJlc2goKSB7XG4gICAgICAgIGlmICh0aGlzLl9jb2xsZWN0aW9uVmlldykge1xuICAgICAgICAgICAgdGhpcy5fY29sbGVjdGlvblZpZXcucmVmcmVzaCgpO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5leHBvcnQgaW50ZXJmYWNlIENvbXBvbmVudFZpZXcge1xuICAgIHJvb3ROb2RlczogYW55W107XG4gICAgZGVzdHJveSgpOiB2b2lkO1xufVxuXG5leHBvcnQgdHlwZSBSb290TG9jYXRvciA9IChub2RlczogYW55W10sIG5lc3RMZXZlbDogbnVtYmVyKSA9PiBWaWV3O1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0SXRlbVZpZXdSb290KHZpZXdSZWY6IENvbXBvbmVudFZpZXcsIHJvb3RMb2NhdG9yOiBSb290TG9jYXRvciA9IGdldFNpbmdsZVZpZXdSZWN1cnNpdmUpOiBWaWV3IHtcbiAgICBjb25zdCByb290VmlldyA9IHJvb3RMb2NhdG9yKHZpZXdSZWYucm9vdE5vZGVzLCAwKTtcbiAgICByZXR1cm4gcm9vdFZpZXc7XG59XG5cbkBEaXJlY3RpdmUoeyBzZWxlY3RvcjogJ1tjdlRlbXBsYXRlS2V5XScgfSlcbmV4cG9ydCBjbGFzcyBUZW1wbGF0ZUtleURpcmVjdGl2ZSB7XG4gICAgY29uc3RydWN0b3IocHJpdmF0ZSB0ZW1wbGF0ZVJlZjogVGVtcGxhdGVSZWY8YW55PiwgQEhvc3QoKSBwcml2YXRlIGNvbGxlY3Rpb25WaWV3OiBDb2xsZWN0aW9uVmlld0NvbXBvbmVudCkge31cblxuICAgIEBJbnB1dCgpXG4gICAgc2V0IGN2VGVtcGxhdGVLZXkodmFsdWU6IGFueSkge1xuICAgICAgICBpZiAoVHJhY2UuaXNFbmFibGVkKCkpIHtcbiAgICAgICAgICAgIENMb2coQ0xvZ1R5cGVzLmluZm8sICdjdlRlbXBsYXRlS2V5OiAnICsgdmFsdWUpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLmNvbGxlY3Rpb25WaWV3ICYmIHRoaXMudGVtcGxhdGVSZWYpIHtcbiAgICAgICAgICAgIHRoaXMuY29sbGVjdGlvblZpZXcucmVnaXN0ZXJUZW1wbGF0ZSh2YWx1ZS50b0xvd2VyQ2FzZSgpLCB0aGlzLnRlbXBsYXRlUmVmKTtcbiAgICAgICAgfVxuICAgIH1cbn1cbiJdfQ==