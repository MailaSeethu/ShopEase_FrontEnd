import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { Products } from 'src/app/Models/Products';
import { ProductsServiceService } from 'src/app/Services/products-service.service';

@Component({
  selector: 'app-admin-access',
  templateUrl: './admin-access.component.html',
  styleUrls: ['./admin-access.component.css']
})
export class AdminAccessComponent implements OnInit {

  formValue!: FormGroup;
  products: Products[];
  panelOpenState = false;
  errormessage: string = "";
  Product: Products = new Products();
  m: Products = new Products();
  deleteid: number;
  ProductCategories: String[];
  newCategory: string = ""; // To store the new category
  constructor(private productsservice: ProductsServiceService, private formBuilder: FormBuilder,
    private router: Router) { }


  ngOnInit(): void {

    this.formValue = this.formBuilder.group({
      productId: [''],
      productName: [''],
      productPrice: [''],
      productCategory: [''],
      noofstocks: [''],
      imageurl: [''],
      productDescription: [''],
      productRating: [''],
      sellerName: ['']

    })
    this.GetProducts();
    this.GetProductCategories();
  }

  GetProductCategories() {
    this.productsservice.GetAllProductCategories().subscribe((result) => {
      this.ProductCategories = result;
      console.log(this.ProductCategories)
    })
  }
  ProductDetails(pid: number) {
    this.productsservice.updateproductid(pid);
    let a = "productdetails";
    localStorage.setItem('pdetails', a)
    this.router.navigate(['productdetails']);
  }

  GetProducts() {
    this.productsservice.GetProducts().subscribe((result) => {
      this.products = result;
    })
  }
  AddProduct() {
    if (this.Product.productCategory === 'new') {
      // Add new category to the list
      if (!this.newCategory.trim()) {
        this.errormessage = "New category cannot be empty.";
        return;
      }
      this.Product.productCategory = this.newCategory.trim();
      this.ProductCategories.push(this.newCategory.trim());
    }

    if (!this.Product.productCategory || !this.Product.productName || this.Product.productPrice === 0) {
      this.errormessage = "Fields cannot be empty";
    } else {
      console.log(this.Product);
      this.productsservice.AddProducts(this.Product).subscribe((result) => {
        this.Product = new Products();
        this.panelOpenState = false;
        this.errormessage = "";
        this.newCategory = "";
        this.GetProducts();
      });
    }
  }
  editData(data: any) {
    this.m.productId = data.productId;
    this.formValue.controls["productId"].setValue(data.productId);
    this.formValue.controls["productName"].setValue(data.productName);
    this.formValue.controls["productPrice"].setValue(data.productPrice);
    this.formValue.controls["productCategory"].setValue(data.productCategory);
    this.formValue.controls["noofstocks"].setValue(data.noofstocks);
    this.formValue.controls["imageurl"].setValue(data.imageurl);
    this.formValue.controls["productDescription"].setValue(data.productDescription);
    this.formValue.controls["productRating"].setValue(data.productRating);
    this.formValue.controls["sellerName"].setValue(data.sellerName);

  }

  updateData() {

    this.m.productId = this.formValue.value.productId;
    this.m.productName = this.formValue.value.productName;
    this.m.productPrice = this.formValue.value.productPrice;
    this.m.productCategory = this.formValue.value.productCategory;
    this.m.noofstocks = this.formValue.value.noofstocks;
    this.m.imageurl = this.formValue.value.imageurl;
    this.m.productRating = this.formValue.value.productRating;
    this.m.productDescription = this.formValue.value.productDescription;
    this.m.sellerName = this.formValue.value.sellerName;
    console.log(this.m)
    this.productsservice.UpdateProducts(this.m).subscribe({
      complete: () => {


        this.formValue.reset();
        this.GetProducts();
      },
      error: (err) => {
        alert('Error' + err.message);
      }
    })
  }
  Delete(id: number) {
    this.deleteid = id;

  }


  DeleteData() {
    this.productsservice.DeleteProduct(this.deleteid).subscribe((r) => {

      this.GetProducts();
    });
  }


}
