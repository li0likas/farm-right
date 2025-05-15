
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Timeline } from 'primereact/timeline';
import { Badge } from 'primereact/badge';
import { Carousel } from 'primereact/carousel';
import { Avatar } from 'primereact/avatar';
import { Chip } from 'primereact/chip';
import { Divider } from 'primereact/divider';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import LanguageToggle from '@/app/components/LanguageToggle';
import Link from 'next/link';

const LandingPage = () => {
    const router = useRouter();
    const t = useTranslations('landing');
    const [showContactDialog, setShowContactDialog] = useState(false);
    const [contactEmail, setContactEmail] = useState('');
    const [contactMessage, setContactMessage] = useState('');

    // Feature cards with localized content
    const features = [
        {
            icon: 'pi pi-map',
            title: t('features.fieldManagement.title'),
            description: t('features.fieldManagement.description'),
            color: 'bg-green-100',
            iconColor: 'text-green-600'
        },
        {
            icon: 'pi pi-list',
            title: t('features.taskManagement.title'),
            description: t('features.taskManagement.description'),
            color: 'bg-blue-100',
            iconColor: 'text-blue-600'
        },
        {
            icon: 'pi pi-truck',
            title: t('features.equipment.title'),
            description: t('features.equipment.description'),
            color: 'bg-purple-100',
            iconColor: 'text-purple-600'
        },
        {
            icon: 'pi pi-cloud',
            title: t('features.weather.title'),
            description: t('features.weather.description'),
            color: 'bg-yellow-100',
            iconColor: 'text-yellow-600'
        },
        {
            icon: 'pi pi-chart-bar',
            title: t('features.analytics.title'),
            description: t('features.analytics.description'),
            color: 'bg-indigo-100',
            iconColor: 'text-indigo-600'
        },
        {
            icon: 'pi pi-users',
            title: t('features.collaboration.title'),
            description: t('features.collaboration.description'),
            color: 'bg-pink-100',
            iconColor: 'text-pink-600'
        }
    ];

    // Timeline events for how it works section
    const howItWorksEvents = [
        {
            status: t('howItWorks.step1.title'),
            date: '1',
            icon: 'pi pi-user-plus',
            color: 'var(--green-500)',
            description: t('howItWorks.step1.description')
        },
        {
            status: t('howItWorks.step2.title'),
            date: '2',
            icon: 'pi pi-map-marker',
            color: 'var(--blue-500)',
            description: t('howItWorks.step2.description')
        },
        {
            status: t('howItWorks.step3.title'),
            date: '3',
            icon: 'pi pi-calendar',
            color: 'var(--purple-500)',
            description: t('howItWorks.step3.description')
        },
        {
            status: t('howItWorks.step4.title'),
            date: '4',
            icon: 'pi pi-chart-line',
            color: 'var(--yellow-500)',
            description: t('howItWorks.step4.description')
        }
    ];

    // Testimonials
    const testimonials = [
        {
            name: "Jonas Petraitis",
            role: t('testimonials.testimonial1.role'),
            content: t('testimonials.testimonial1.content'),
            avatar: 'JP',
            rating: 5
        },
        {
            name: "Marytė Kazlauskienė",
            role: t('testimonials.testimonial2.role'),
            content: t('testimonials.testimonial2.content'),
            avatar: 'MK',
            rating: 5
        },
        {
            name: "Antanas Stankevičius",
            role: t('testimonials.testimonial3.role'),
            content: t('testimonials.testimonial3.content'),
            avatar: 'AS',
            rating: 5
        }
    ];

    // Pricing plans
    const pricingPlans = [
        {
            name: t('pricing.basic.name'),
            price: t('pricing.basic.price'),
            description: t('pricing.basic.description'),
            features: [
                t('pricing.basic.features.feature1'),
                t('pricing.basic.features.feature2'),
                t('pricing.basic.features.feature3'),
                t('pricing.basic.features.feature4')
            ],
            buttonLabel: t('pricing.basic.button'),
            popular: false
        },
        {
            name: t('pricing.professional.name'),
            price: t('pricing.professional.price'),
            description: t('pricing.professional.description'),
            features: [
                t('pricing.professional.features.feature1'),
                t('pricing.professional.features.feature2'),
                t('pricing.professional.features.feature3'),
                t('pricing.professional.features.feature4'),
                t('pricing.professional.features.feature5')
            ],
            buttonLabel: t('pricing.professional.button'),
            popular: true
        },
        {
            name: t('pricing.enterprise.name'),
            price: t('pricing.enterprise.price'),
            description: t('pricing.enterprise.description'),
            features: [
                t('pricing.enterprise.features.feature1'),
                t('pricing.enterprise.features.feature2'),
                t('pricing.enterprise.features.feature3'),
                t('pricing.enterprise.features.feature4'),
                t('pricing.enterprise.features.feature5'),
                t('pricing.enterprise.features.feature6')
            ],
            buttonLabel: t('pricing.enterprise.button'),
            popular: false
        }
    ];

    const handleContactSubmit = () => {
        if (!contactEmail || !contactMessage) {
            toast.error(t('contact.fillFields'));
            return;
        }
        toast.success(t('contact.success'));
        setShowContactDialog(false);
        setContactEmail('');
        setContactMessage('');
    };

    const testimonialTemplate = (testimonial: any) => {
        return (
            <Card className="mx-2 text-center">
                <div className="mb-3">
                    <Avatar 
                        label={testimonial.avatar} 
                        size="large" 
                        style={{ backgroundColor: '#2196F3', color: '#ffffff' }}
                        shape="circle"
                    />
                </div>
                <h4 className="mb-1">{testimonial.name}</h4>
                <p className="text-gray-600 mb-3">{testimonial.role}</p>
                <div className="mb-3">
                    {[...Array(testimonial.rating)].map((_, i) => (
                        <i key={i} className="pi pi-star-fill text-yellow-500 mr-1"></i>
                    ))}
                </div>
                <p className="text-gray-700 italic">"{testimonial.content}"</p>
            </Card>
        );
    };

    return (
        <div className="landing-page">
            {/* Header/Navigation */}
            <header className="sticky top-0 z-50 bg-white shadow-sm">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex justify-content-between align-items-center">
                        <div className="flex align-items-center">
                            <img 
                                src="/layout/images/zuvs-logo.png" 
                                alt="ŽŪVS Logo" 
                                className="h-3rem mr-3"
                            />
                            <h1 className="text-2xl font-bold text-primary m-0">ŽŪVS</h1>
                        </div>
                        
                        <nav className="hidden md:flex align-items-center gap-4">
                            <a href="#features" className="text-gray-700 hover:text-primary transition-colors">{t('nav.features')}</a>
                            <a href="#how-it-works" className="text-gray-700 hover:text-primary transition-colors">{t('nav.howItWorks')}</a>
                            {/* <a href="#pricing" className="text-gray-700 hover:text-primary transition-colors">{t('nav.pricing')}</a> */}
                            <a href="#testimonials" className="text-gray-700 hover:text-primary transition-colors">{t('nav.testimonials')}</a>
                            <Button 
                                label={t('nav.login')} 
                                className="p-button-outlined p-button-primary"
                                onClick={() => router.push('/auth/login')}
                            />
                            <Button 
                                label={t('nav.signup')} 
                                className="p-button-primary"
                                onClick={() => router.push('/auth/signup')}
                            />
                            <LanguageToggle />
                        </nav>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="hero-section bg-gradient-to-br from-primary-50 to-primary-100 py-8">
                <div className="container mx-auto px-4">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="text-center"
                    >
                        <h1 className="text-5xl font-bold text-primary mb-4">
                            {t('hero.title')}
                        </h1>
                        <p className="text-xl text-gray-700 mb-6 max-w-3xl mx-auto">
                            {t('hero.subtitle')}
                        </p>
                        <div className="flex gap-3 justify-content-center">
                            <Button 
                                label={t('hero.cta.primary')} 
                                size="large" 
                                className="p-button-primary"
                                onClick={() => router.push('/auth/signup')}
                            />
                            {/* <Button 
                                label={t('hero.cta.secondary')} 
                                size="large" 
                                className="p-button-outlined"
                                onClick={() => router.push('/auth/login')}
                            /> */}
                        </div>
                        
                        {/* Hero Image/Illustration */}
                        <div className="mt-8">
                            <img 
                                src="/images/illustration.png" 
                                alt="Farm Management Illustration" 
                                className="max-w-full h-auto"
                                style={{ maxHeight: '1000px' }}
                            />
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-8">
                <div className="container mx-auto px-4">
                    <motion.div 
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        transition={{ duration: 0.5 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="text-4xl font-bold text-center mb-3">{t('features.title')}</h2>
                        <p className="text-xl text-center text-gray-600 mb-6 max-w-3xl mx-auto">
                            {t('features.subtitle')}
                        </p>
                        
                        <div className="grid">
                            {features.map((feature, index) => (
                                <motion.div 
                                    key={index}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: index * 0.1 }}
                                    viewport={{ once: true }}
                                    className="col-12 md:col-6 lg:col-4 p-3"
                                >
                                    <Card className="h-full hover:shadow-4 transition-shadow cursor-pointer">
                                        <div className={`w-4rem h-4rem ${feature.color} border-round flex align-items-center justify-content-center mb-3`}>
                                            <i className={`${feature.icon} text-3xl ${feature.iconColor}`}></i>
                                        </div>
                                        <h3 className="mb-2">{feature.title}</h3>
                                        <p className="text-gray-600">{feature.description}</p>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* How It Works Section */}
            <section id="how-it-works" className="py-8 bg-gray-50">
                <div className="container mx-auto px-4">
                    <h2 className="text-4xl font-bold text-center mb-3">{t('howItWorks.title')}</h2>
                    <p className="text-xl text-center text-gray-600 mb-6 max-w-3xl mx-auto">
                        {t('howItWorks.subtitle')}
                    </p>
                    
                    <div className="timeline-horizontal max-w-4xl mx-auto">
                        <Timeline 
                            value={howItWorksEvents} 
                            align="alternate"
                            className="customized-timeline"
                            marker={(item) => (
                                <span className="custom-marker shadow-1" style={{ backgroundColor: item.color }}>
                                    <i className={item.icon}></i>
                                </span>
                            )}
                            content={(item) => (
                                <Card className="shadow-1">
                                    <h3 className="font-bold">{item.status}</h3>
                                    <p className="text-gray-600">{item.description}</p>
                                </Card>
                            )}
                        />
                    </div>
                </div>
            </section>

            {/* Pricing Section
            <section id="pricing" className="py-8">
                <div className="container mx-auto px-4">
                    <h2 className="text-4xl font-bold text-center mb-3">{t('pricing.title')}</h2>
                    <p className="text-xl text-center text-gray-600 mb-6 max-w-3xl mx-auto">
                        {t('pricing.subtitle')}
                    </p>
                    
                    <div className="grid justify-content-center">
                        {pricingPlans.map((plan, index) => (
                            <motion.div 
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                viewport={{ once: true }}
                                className="col-12 md:col-6 lg:col-4 p-3"
                            >
                                <Card className={`h-full ${plan.popular ? 'border-primary-500 shadow-4' : ''}`}>
                                    {plan.popular && (
                                        <Chip label={t('pricing.popular')} className="p-chip-primary mb-3" />
                                    )}
                                    
                                    <h3 className="text-2xl mb-2">{plan.name}</h3>
                                    <p className="text-4xl font-bold text-primary mb-1">{plan.price}</p>
                                    <p className="text-gray-600 mb-4">{plan.description}</p>
                                    
                                    <Divider />
                                    
                                    <ul className="list-none p-0 mb-4">
                                        {plan.features.map((feature, i) => (
                                            <li key={i} className="mb-2 flex align-items-center">
                                                <i className="pi pi-check-circle text-green-500 mr-2"></i>
                                                <span>{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    
                                    <Button 
                                        label={plan.buttonLabel} 
                                        className={plan.popular ? 'w-full p-button-primary' : 'w-full p-button-outlined'}
                                        onClick={() => router.push('/auth/signup')}
                                    />
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section> */}

            {/* Testimonials Section */}
            <section id="testimonials" className="py-8 bg-gray-50">
                <div className="container mx-auto px-4">
                    <h2 className="text-4xl font-bold text-center mb-3">{t('testimonials.title')}</h2>
                    <p className="text-xl text-center text-gray-600 mb-6 max-w-3xl mx-auto">
                        {t('testimonials.subtitle')}
                    </p>
                    
                    <Carousel 
                        value={testimonials} 
                        itemTemplate={testimonialTemplate}
                        numVisible={3}
                        numScroll={1}
                        responsiveOptions={[
                            {
                                breakpoint: '1024px',
                                numVisible: 2,
                                numScroll: 1
                            },
                            {
                                breakpoint: '768px',
                                numVisible: 1,
                                numScroll: 1
                            }
                        ]}
                        autoplayInterval={5000}
                        circular
                    />
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-8 bg-primary">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-4xl font-bold text-white mb-4">{t('cta.title')}</h2>
                    <p className="text-xl text-primary-100 mb-6 max-w-3xl mx-auto">
                        {t('cta.subtitle')}
                    </p>
                    <div className="flex gap-3 justify-content-center">
                        <Button 
                            label={t('cta.start')} 
                            size="large" 
                            className="p-button-outlined bg-white text-primary hover:bg-primary-50"
                            onClick={() => router.push('/auth/signup')}
                        />
                        <Button 
                            label={t('cta.contact')} 
                            size="large" 
                            className="p-button-outlined border-white text-white hover:bg-primary-600"
                            onClick={() => setShowContactDialog(true)}
                        />
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-white py-8">
                <div className="container mx-auto px-4">
                    <div className="grid">
                        <div className="col-12 md:col-6 lg:col-3 mb-4">
                            <h4 className="mb-3 text-primary-200">{t('footer.about.title')}</h4>
                            <p className="text-gray-400">
                                {t('footer.about.description')}
                            </p>
                        </div>
                        <div className="col-12 md:col-6 lg:col-3 mb-4">
                            <h4 className="mb-3 text-primary-200">{t('footer.links.title')}</h4>
                            <ul className="list-none p-0">
                                <li className="mb-2">
                                    <a href="#features" className="text-gray-400 hover:text-white transition-colors">
                                        {t('footer.links.features')}
                                    </a>
                                </li>
                                {/* <li className="mb-2">
                                    <a href="#pricing" className="text-gray-400 hover:text-white transition-colors">
                                        {t('footer.links.pricing')}
                                    </a>
                                </li> */}
                                <li className="mb-2">
                                    <Link href="/auth/login" className="text-gray-400 hover:text-white transition-colors">
                                        {t('footer.links.login')}
                                    </Link>
                                </li>
                                <li className="mb-2">
                                    <Link href="/auth/signup" className="text-gray-400 hover:text-white transition-colors">
                                        {t('footer.links.signup')}
                                    </Link>
                                </li>
                            </ul>
                        </div>
                        <div className="col-12 md:col-6 lg:col-3 mb-4">
                            <h4 className="mb-3 text-primary-200">{t('footer.contact.title')}</h4>
                            <p className="text-gray-400 mb-2">
                                <i className="pi pi-envelope mr-2"></i>
                                {t('footer.contact.email')}
                            </p>
                            <p className="text-gray-400 mb-2">
                                <i className="pi pi-phone mr-2"></i>
                                {t('footer.contact.phone')}
                            </p>
                            <p className="text-gray-400">
                                <i className="pi pi-map-marker mr-2"></i>
                                {t('footer.contact.address')}
                            </p>
                        </div>
                        <div className="col-12 md:col-6 lg:col-3 mb-4">
                            <h4 className="mb-3 text-primary-200">{t('footer.social.title')}</h4>
                            <div className="flex gap-3">
                                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                                    <i className="pi pi-facebook text-2xl"></i>
                                </a>
                                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                                    <i className="pi pi-twitter text-2xl"></i>
                                </a>
                                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                                    <i className="pi pi-instagram text-2xl"></i>
                                </a>
                                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                                    <i className="pi pi-linkedin text-2xl"></i>
                                </a>
                            </div>
                        </div>
                    </div>
                    
                    <Divider className="my-4" />
                    
                    <div className="text-center text-gray-400">
                        <p className="mb-0">
                            {t('footer.copyright', { year: new Date().getFullYear() })}
                        </p>
                    </div>
                </div>
            </footer>

            {/* Contact Dialog */}
            <Dialog
                header={t('contact.title')}
                visible={showContactDialog}
                onHide={() => setShowContactDialog(false)}
                style={{ width: '500px' }}
                footer={
                    <div>
                        <Button 
                            label={t('contact.cancel')} 
                            icon="pi pi-times" 
                            className="p-button-text" 
                            onClick={() => setShowContactDialog(false)} 
                        />
                        <Button 
                            label={t('contact.send')} 
                            icon="pi pi-send" 
                            onClick={handleContactSubmit}
                        />
                    </div>
                }
            >
                <div className="p-fluid">
                    <div className="field mb-4">
                        <label htmlFor="email" className="block mb-2 font-medium">
                            {t('contact.email')}
                        </label>
                        <InputText
                            id="email"
                            value={contactEmail}
                            onChange={(e) => setContactEmail(e.target.value)}
                            type="email"
                            placeholder={t('contact.emailPlaceholder')}
                        />
                    </div>
                    
                    <div className="field">
                        <label htmlFor="message" className="block mb-2 font-medium">
                            {t('contact.message')}
                        </label>
                        <textarea
                            id="message"
                            value={contactMessage}
                            onChange={(e) => setContactMessage(e.target.value)}
                            rows={5}
                            className="p-inputtextarea w-full"
                            placeholder={t('contact.messagePlaceholder')}
                        />
                    </div>
                </div>
            </Dialog>
        </div>
    );
};

export default LandingPage;