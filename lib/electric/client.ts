import { Shape, ShapeStream } from "@electric-sql/client";

/**
 * Simple Electric SQL client that routes through our auth proxy
 * Uses Electric SQL's native parameter interface directly
 */
export class AuthenticatedElectricClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_ELECTRIC_URL || "/api/electric/auth";
  }

  /**
   * Create a ShapeStream using Electric SQL's native parameter interface
   * All user filtering is handled automatically by the auth proxy
   */
  createShapeStream(shapeParams: {
    table: string;
    where?: string;
    params?: string[];
    columns?: string[];
  }): ShapeStream {
    return new ShapeStream({
      url: this.baseUrl,
      params: shapeParams,
    });
  }

  /**
   * Create a Shape using Electric SQL's native parameter interface
   * All user filtering is handled automatically by the auth proxy
   */
  createShape(params: {
    table: string;
    where?: string;
    params?: string[];
    columns?: string[];
  }): Shape {
    const stream = this.createShapeStream(params);
    return new Shape(stream);
  }
}

// Singleton instance
export const electricClient = new AuthenticatedElectricClient();
