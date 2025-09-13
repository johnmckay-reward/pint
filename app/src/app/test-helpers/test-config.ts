import { HttpClientTestingModule } from '@angular/common/http/testing';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { RouterTestingModule } from '@angular/router/testing';

/**
 * Common test configuration for components that use API services
 */
export const commonTestConfig = {
  imports: [
    HttpClientTestingModule,
    IonicModule.forRoot(),
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterTestingModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA]
};

/**
 * Common test configuration for pages that use routing
 */
export const pageTestConfig = {
  imports: [
    HttpClientTestingModule,
    IonicModule.forRoot(),
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterTestingModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA]
};