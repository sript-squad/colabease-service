import { Injectable, UnauthorizedException, Inject, forwardRef } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { JwksClient } from 'jwks-rsa';
import { UserService } from './user.service';

export interface CognitoUser {
    sub: string;
    email: string;
    token_use: string;
    [key: string]: any;
}

@Injectable()
export class TokenHandleService {
    private readonly client;

    constructor(
        @Inject(forwardRef(() => UserService))
        private readonly userService: UserService,
    ) {
        this.client = new JwksClient({
            jwksUri: 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_8VI7Ort8W/.well-known/jwks.json',
            cache: true,
            rateLimit: true,
        });
    }

    private getKey(header: jwt.JwtHeader): Promise<string> {
        return new Promise((resolve, reject) => {
            if (!header.kid) {
                return reject(new UnauthorizedException('Invalid token header'));
            }

            this.client.getSigningKey(header.kid, (err, key) => {
                if (err || !key) {
                    return reject(new UnauthorizedException('Unable to get signing key'));
                }

                const signingKey = key.getPublicKey();
                resolve(signingKey);
            });
        });
    }


    async verifyToken(token: string): Promise<CognitoUser> {
        try {
            const decoded = await new Promise<CognitoUser>((resolve, reject) => {
                jwt.verify(
                    token,
                    async (header, callback) => {
                        try {
                            const key = await this.getKey(header);
                            callback(null, key);
                        } catch (err) {
                            callback(err as any, undefined);
                        }
                    },
                    {
                        algorithms: ['RS256'],
                        issuer:
                            'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_8VI7Ort8W',
                        audience: '2i6fahiaqnn4k9rl0diane7908',
                    },
                    (err, decoded) => {
                        if (err || !decoded) return reject(err);
                        resolve(decoded as CognitoUser);
                    }
                );
            });

            if (decoded.token_use !== 'id') {
                throw new UnauthorizedException('Invalid token_use');
            }

            // Sync user to database
            await this.userService.upsert(
                decoded.email,
                decoded.sub,
                decoded['preferred_username'] || decoded.email?.split('@')[0]
            );

            return decoded;
        } catch (error) {
            console.error('Token verification error:', error);
            throw new UnauthorizedException('Invalid or expired token');
        }
    }


}
