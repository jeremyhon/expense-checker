import { Shape, ShapeStream } from "@electric-sql/client";

/**
 * Simple Electric SQL client that routes through our auth proxy
 * Uses Electric SQL's native parameter interface directly
 */
export class AuthenticatedElectricClient {
  private baseUrl: string;

  constructor() {
    // Use the auth proxy endpoint with proper URL construction for client-side
    if (typeof window !== "undefined") {
      // Client-side: construct full URL from current origin
      this.baseUrl = `${window.location.origin}/api/electric/auth`;
    } else {
      // Server-side: use relative path (though this client is primarily for client-side use)
      this.baseUrl = "/api/electric/auth";
    }
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
